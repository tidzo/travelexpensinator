from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class JourneyBase(BaseModel):
    trip_id: int
    date: date
    description: Optional[str] = None

class JourneyCreate(JourneyBase):
    pass

class JourneyUpdate(BaseModel):
    trip_id: Optional[int] = None
    date: Optional[date] = None
    description: Optional[str] = None

class JourneyResponse(JourneyBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True