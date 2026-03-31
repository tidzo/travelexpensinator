from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List

class TripBase(BaseModel):
    start_date: date
    end_date: date
    notes: Optional[str] = None

class TripCreate(TripBase):
    pass

class TripUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None

class TripResponse(TripBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True