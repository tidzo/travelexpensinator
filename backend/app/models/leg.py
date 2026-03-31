from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class TransportMode(str, enum.Enum):
    TRAIN = "TRAIN"
    TUBE = "TUBE"
    TAXI = "TAXI"
    FLIGHT = "FLIGHT"
    BUS = "BUS"
    WALK = "WALK"
    CAR = "CAR"
    OTHER = "OTHER"

class Leg(Base):
    __tablename__ = "legs"

    id = Column(Integer, primary_key=True, index=True)
    journey_id = Column(Integer, ForeignKey("journeys.id"), nullable=False)
    mode_of_transport = Column(Enum(TransportMode), nullable=False)
    origin_location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    destination_location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    journey = relationship("Journey", back_populates="legs")
    origin_location = relationship("Location", foreign_keys=[origin_location_id])
    destination_location = relationship("Location", foreign_keys=[destination_location_id])
    expense_items = relationship("ExpenseItem", back_populates="leg", cascade="all, delete-orphan")