from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.core.database import get_db
from app.models.leg import Leg
from app.schemas.leg import LegCreate, LegUpdate, LegResponse

router = APIRouter(prefix="/legs", tags=["legs"])

@router.post("/", response_model=LegResponse)
def create_leg(leg: LegCreate, db: Session = Depends(get_db)):
    db_leg = Leg(**leg.dict())
    db.add(db_leg)
    db.commit()
    db.refresh(db_leg)
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

    db.commit()
    db.refresh(leg)
    return leg

@router.delete("/{leg_id}")
def delete_leg(leg_id: int, db: Session = Depends(get_db)):
    leg = db.query(Leg).filter(Leg.id == leg_id).first()
    if not leg:
        raise HTTPException(status_code=404, detail="Leg not found")

    db.delete(leg)
    db.commit()
    return {"message": "Leg deleted successfully"}