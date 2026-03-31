from sqlalchemy import Column, Integer, Date, String, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Journey(Base):
    __tablename__ = "journeys"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    date = Column(Date, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trip = relationship("Trip", back_populates="journeys")
    legs = relationship("Leg", back_populates="journey", cascade="all, delete-orphan")
    expense_items = relationship("ExpenseItem", back_populates="journey", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_journey_trip_date", "trip_id", "date"),
    )