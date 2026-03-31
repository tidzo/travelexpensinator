from pydantic import BaseModel
from datetime import datetime
from app.models.location import LocationType
from typing import Optional

class LocationBase(BaseModel):
    name: str
    type: LocationType
    notes: Optional[str] = None

class LocationCreate(LocationBase):
    pass

class LocationUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[LocationType] = None
    notes: Optional[str] = None

class LocationResponse(LocationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True