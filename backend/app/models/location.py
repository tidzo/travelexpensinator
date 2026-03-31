from sqlalchemy import Column, Integer, String, Text, DateTime, Enum
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class LocationType(str, enum.Enum):
    HOME = "HOME"
    WORK = "WORK"
    HOTEL = "HOTEL"
    STATION = "STATION"
    AIRPORT = "AIRPORT"
    OTHER = "OTHER"

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(Enum(LocationType), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())