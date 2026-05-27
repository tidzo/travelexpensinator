from pydantic import BaseModel
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

class ExpenseItemBase(BaseModel):
    category_id: int
    date: date
    description: str
    notes: Optional[str] = None
    amount_gbp: Decimal
    is_billable: bool = True
    is_monthly_expense: bool = False

class ExpenseItemCreate(ExpenseItemBase):
    trip_id: Optional[int] = None
    journey_id: Optional[int] = None
    leg_id: Optional[int] = None

class ExpenseItemUpdate(BaseModel):
    trip_id: Optional[int] = None
    journey_id: Optional[int] = None
    leg_id: Optional[int] = None
    category_id: Optional[int] = None
    date: Optional[date] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    amount_gbp: Optional[Decimal] = None
    is_billable: Optional[bool] = None
    is_monthly_expense: Optional[bool] = None

class ExpenseItemResponse(ExpenseItemBase):
    id: int
    trip_id: Optional[int]
    journey_id: Optional[int]
    leg_id: Optional[int]
    ex_vat_amount: Decimal
    vat_amount: Decimal
    created_at: datetime
    updated_at: datetime
    evidence_count: int = 0

    class Config:
        from_attributes = True