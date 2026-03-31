from pydantic import BaseModel
from datetime import datetime
from app.models.leg import TransportMode
from typing import Optional

class LegBase(BaseModel):
    journey_id: int
    mode_of_transport: TransportMode
    origin_location_id: int
    destination_location_id: int
    notes: Optional[str] = None

class LegCreate(LegBase):
    pass

class LegUpdate(BaseModel):
    journey_id: Optional[int] = None
    mode_of_transport: Optional[TransportMode] = None
    origin_location_id: Optional[int] = None
    destination_location_id: Optional[int] = None
    notes: Optional[str] = None

class LegResponse(LegBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True