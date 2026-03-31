from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.trip import Trip
from app.schemas.trip import TripCreate, TripUpdate, TripResponse
from app.services.trip_service import TripService

router = APIRouter(prefix="/trips", tags=["trips"])

@router.post("/", response_model=TripResponse)
def create_trip(trip: TripCreate, db: Session = Depends(get_db)):
    service = TripService(db)
    return service.create_trip(trip)

@router.get("/", response_model=List[TripResponse])
def list_trips(db: Session = Depends(get_db)):
    return db.query(Trip).all()

@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip

@router.put("/{trip_id}", response_model=TripResponse)
def update_trip(trip_id: int, trip_update: TripUpdate, db: Session = Depends(get_db)):
    service = TripService(db)
    try:
        return service.update_trip(trip_id, trip_update)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/{trip_id}")
def delete_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    db.delete(trip)
    db.commit()
    return {"message": "Trip deleted successfully"}