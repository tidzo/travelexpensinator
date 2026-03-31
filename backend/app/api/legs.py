from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from decimal import Decimal
from app.core.database import get_db
from app.models.leg import Leg
from app.models.expense_item import ExpenseItem
from app.models.expense_category import ExpenseCategory
from app.models.journey import Journey
from app.models.location import Location
from app.schemas.leg import LegCreate, LegUpdate, LegResponse

router = APIRouter(prefix="/legs", tags=["legs"])

@router.post("/", response_model=LegResponse)
def create_leg(leg: LegCreate, db: Session = Depends(get_db)):
    # Create the leg
    db_leg = Leg(**leg.dict())
    db.add(db_leg)
    db.commit()
    db.refresh(db_leg)

    # Get the journey to extract the date and trip info
    journey = db.query(Journey).filter(Journey.id == db_leg.journey_id).first()
    if not journey:
        raise HTTPException(status_code=400, detail="Journey not found")

    # Find the Travel category
    travel_category = db.query(ExpenseCategory).filter(ExpenseCategory.name == "Travel").first()
    if not travel_category:
        raise HTTPException(status_code=400, detail="Travel category not found")

    # Get the origin and destination locations to create proper description
    origin_location = db.query(Location).filter(Location.id == db_leg.origin_location_id).first()
    destination_location = db.query(Location).filter(Location.id == db_leg.destination_location_id).first()

    origin_name = origin_location.name if origin_location else f"Location {db_leg.origin_location_id}"
    destination_name = destination_location.name if destination_location else f"Location {db_leg.destination_location_id}"

    # Create description in the same format as the dropdown: "TRAIN: Origin → Destination"
    description = f"{db_leg.mode_of_transport.value}: {origin_name} → {destination_name}"

    # Create associated expense with default amount of £0.00
    expense = ExpenseItem(
        leg_id=db_leg.id,
        journey_id=journey.id,
        trip_id=journey.trip_id,
        category_id=travel_category.id,
        date=journey.date,
        description=description,
        amount_gbp=Decimal("0.00"),
        ex_vat_amount=Decimal("0.00"),
        vat_amount=Decimal("0.00"),
        is_billable=True,
        is_monthly_expense=False
    )

    db.add(expense)
    db.commit()

    return db_leg

@router.get("/", response_model=List[LegResponse])
def list_legs(
    journey_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Leg).options(
        joinedload(Leg.origin_location),
        joinedload(Leg.destination_location)
    )
    if journey_id:
        query = query.filter(Leg.journey_id == journey_id)
    return query.order_by(Leg.created_at).all()

@router.get("/{leg_id}", response_model=LegResponse)
def get_leg(leg_id: int, db: Session = Depends(get_db)):
    leg = db.query(Leg).filter(Leg.id == leg_id).first()
    if not leg:
        raise HTTPException(status_code=404, detail="Leg not found")
    return leg

@router.put("/{leg_id}", response_model=LegResponse)
def update_leg(leg_id: int, leg_update: LegUpdate, db: Session = Depends(get_db)):
    leg = db.query(Leg).filter(Leg.id == leg_id).first()
    if not leg:
        raise HTTPException(status_code=404, detail="Leg not found")

    for field, value in leg_update.dict(exclude_unset=True).items():
        setattr(leg, field, value)

    # Update the associated expense description if transport mode or locations changed
    associated_expense = db.query(ExpenseItem).filter(ExpenseItem.leg_id == leg_id).first()
    if associated_expense:
        # Get the updated location names
        origin_location = db.query(Location).filter(Location.id == leg.origin_location_id).first()
        destination_location = db.query(Location).filter(Location.id == leg.destination_location_id).first()

        origin_name = origin_location.name if origin_location else f"Location {leg.origin_location_id}"
        destination_name = destination_location.name if destination_location else f"Location {leg.destination_location_id}"

        # Update description to match the new leg details
        new_description = f"{leg.mode_of_transport.value}: {origin_name} → {destination_name}"
        associated_expense.description = new_description

    db.commit()
    db.refresh(leg)
    return leg

@router.delete("/{leg_id}")
def delete_leg(leg_id: int, db: Session = Depends(get_db)):
    leg = db.query(Leg).filter(Leg.id == leg_id).first()
    if not leg:
        raise HTTPException(status_code=404, detail="Leg not found")

    # Delete associated expense
    associated_expense = db.query(ExpenseItem).filter(ExpenseItem.leg_id == leg_id).first()
    if associated_expense:
        db.delete(associated_expense)

    db.delete(leg)
    db.commit()
    return {"message": "Leg and associated expense deleted successfully"}