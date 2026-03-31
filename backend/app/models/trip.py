from sqlalchemy import Column, Integer, Date, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    journeys = relationship("Journey", back_populates="trip", cascade="all, delete-orphan")
    expense_items = relationship("ExpenseItem", back_populates="trip", cascade="all, delete-orphan")