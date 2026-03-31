from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from app.models.expense_category import VATStatus
from typing import Optional

class ExpenseCategoryBase(BaseModel):
    name: str
    vat_status: VATStatus
    default_amount: Optional[Decimal] = None

class ExpenseCategoryCreate(ExpenseCategoryBase):
    pass

class ExpenseCategoryUpdate(BaseModel):
    name: Optional[str] = None
    vat_status: Optional[VATStatus] = None
    default_amount: Optional[Decimal] = None

class ExpenseCategoryResponse(ExpenseCategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True