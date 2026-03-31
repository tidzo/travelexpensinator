from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.expense_category import ExpenseCategory
from app.schemas.expense_category import ExpenseCategoryCreate, ExpenseCategoryUpdate, ExpenseCategoryResponse

router = APIRouter(prefix="/expense-categories", tags=["expense_categories"])

@router.post("/", response_model=ExpenseCategoryResponse)
def create_expense_category(category: ExpenseCategoryCreate, db: Session = Depends(get_db)):
    db_category = ExpenseCategory(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.get("/", response_model=List[ExpenseCategoryResponse])
def list_expense_categories(db: Session = Depends(get_db)):
    return db.query(ExpenseCategory).order_by(ExpenseCategory.name).all()

@router.get("/{category_id}", response_model=ExpenseCategoryResponse)
def get_expense_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(ExpenseCategory).filter(ExpenseCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Expense category not found")
    return category

@router.put("/{category_id}", response_model=ExpenseCategoryResponse)
def update_expense_category(category_id: int, category_update: ExpenseCategoryUpdate, db: Session = Depends(get_db)):
    category = db.query(ExpenseCategory).filter(ExpenseCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Expense category not found")

    for field, value in category_update.dict(exclude_unset=True).items():
        setattr(category, field, value)

    db.commit()
    db.refresh(category)
    return category

@router.delete("/{category_id}")
def delete_expense_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(ExpenseCategory).filter(ExpenseCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Expense category not found")

    db.delete(category)
    db.commit()
    return {"message": "Expense category deleted successfully"}