from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
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
def list_trips(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Trip)

    if month is not None and year is not None:
        # Filter trips that overlap with the specified month/year
        from sqlalchemy import and_
        from datetime import date, timedelta

        # Create start and end dates for the month
        if month == 12:
            next_month_start = date(year + 1, 1, 1)
        else:
            next_month_start = date(year, month + 1, 1)

        month_start = date(year, month, 1)
        month_end = date(next_month_start.year, next_month_start.month, next_month_start.day) - timedelta(days=1)

        # A trip overlaps with the month if:
        # - Trip starts before month ends AND trip ends after month starts
        query = query.filter(
            and_(
                Trip.start_date <= month_end,
                Trip.end_date >= month_start
            )
        )

    return query.order_by(Trip.start_date.asc()).all()

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