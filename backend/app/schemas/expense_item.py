from pydantic import BaseModel, model_validator
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Any

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

    @model_validator(mode='before')
    @classmethod
    def coerce_date_string(cls, data: Any) -> Any:
        if isinstance(data, dict) and isinstance(data.get('date'), str):
            data = dict(data)
            data['date'] = date.fromisoformat(data['date'])
        return data

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