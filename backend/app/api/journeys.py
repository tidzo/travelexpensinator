from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.journey import Journey
from app.schemas.journey import JourneyCreate, JourneyUpdate, JourneyResponse

router = APIRouter(prefix="/journeys", tags=["journeys"])

@router.post("/", response_model=JourneyResponse)
def create_journey(journey: JourneyCreate, db: Session = Depends(get_db)):
    db_journey = Journey(**journey.dict())
    db.add(db_journey)
    db.commit()
    db.refresh(db_journey)
    return db_journey

@router.get("/", response_model=List[JourneyResponse])
def list_journeys(
    trip_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Journey)
    if trip_id:
        query = query.filter(Journey.trip_id == trip_id)
    return query.order_by(Journey.date).all()

@router.get("/{journey_id}", response_model=JourneyResponse)
def get_journey(journey_id: int, db: Session = Depends(get_db)):
    journey = db.query(Journey).filter(Journey.id == journey_id).first()
    if not journey:
        raise HTTPException(status_code=404, detail="Journey not found")
    return journey

@router.put("/{journey_id}", response_model=JourneyResponse)
def update_journey(journey_id: int, journey_update: JourneyUpdate, db: Session = Depends(get_db)):
    journey = db.query(Journey).filter(Journey.id == journey_id).first()
    if not journey:
        raise HTTPException(status_code=404, detail="Journey not found")

    for field, value in journey_update.dict(exclude_unset=True).items():
        setattr(journey, field, value)

    db.commit()
    db.refresh(journey)
    return journey

@router.delete("/{journey_id}")
def delete_journey(journey_id: int, db: Session = Depends(get_db)):
    journey = db.query(Journey).filter(Journey.id == journey_id).first()
    if not journey:
        raise HTTPException(status_code=404, detail="Journey not found")

    db.delete(journey)
    db.commit()
    return {"message": "Journey deleted successfully"}