from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Numeric, Boolean, Index, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class ExpenseItem(Base):
    __tablename__ = "expense_items"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    journey_id = Column(Integer, ForeignKey("journeys.id"), nullable=True)
    leg_id = Column(Integer, ForeignKey("legs.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("expense_categories.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    description = Column(String, nullable=False)
    amount_gbp = Column(Numeric(10, 2), nullable=False)
    ex_vat_amount = Column(Numeric(10, 2), nullable=False, default=0)
    vat_amount = Column(Numeric(10, 2), nullable=False, default=0)
    is_billable = Column(Boolean, nullable=False, default=True)
    is_monthly_expense = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    trip = relationship("Trip", back_populates="expense_items")
    journey = relationship("Journey", back_populates="expense_items")
    leg = relationship("Leg", back_populates="expense_items")
    category = relationship("ExpenseCategory", back_populates="expense_items")
    evidence_links = relationship("ExpenseEvidenceLink", back_populates="expense_item", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_expense_item_date", "date"),
        Index("ix_expense_item_trip", "trip_id"),
        Index("ix_expense_item_category", "category_id"),
        CheckConstraint(
            "trip_id IS NOT NULL OR journey_id IS NOT NULL OR leg_id IS NOT NULL OR is_monthly_expense = true",
            name="expense_item_must_belong_somewhere"
        ),
    )