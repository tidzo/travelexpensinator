from sqlalchemy import Column, Integer, String, DateTime, Enum, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class VATStatus(str, enum.Enum):
    STANDARD = "STANDARD"
    ZERO_RATED = "ZERO_RATED"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"

class ExpenseCategory(Base):
    __tablename__ = "expense_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    vat_status = Column(Enum(VATStatus), nullable=False)
    default_amount = Column(Numeric(10, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    expense_items = relationship("ExpenseItem", back_populates="category")