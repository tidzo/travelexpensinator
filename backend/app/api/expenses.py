from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.expense_item import ExpenseItem
from app.schemas.expense_item import ExpenseItemCreate, ExpenseItemUpdate, ExpenseItemResponse
from app.services.expense_service import ExpenseService

router = APIRouter(prefix="/expenses", tags=["expenses"])

@router.post("/", response_model=ExpenseItemResponse)
def create_expense(expense: ExpenseItemCreate, db: Session = Depends(get_db)):
    service = ExpenseService(db)
    try:
        return service.create_expense(expense)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[ExpenseItemResponse])
def list_expenses(
    trip_id: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(ExpenseItem)

    if trip_id:
        query = query.filter(ExpenseItem.trip_id == trip_id)

    if month and year:
        from sqlalchemy import extract
        query = query.filter(
            extract('month', ExpenseItem.date) == month,
            extract('year', ExpenseItem.date) == year
        )

    return query.all()

@router.get("/{expense_id}", response_model=ExpenseItemResponse)
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(ExpenseItem).filter(ExpenseItem.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

@router.put("/{expense_id}", response_model=ExpenseItemResponse)
def update_expense(expense_id: int, expense_update: ExpenseItemUpdate, db: Session = Depends(get_db)):
    service = ExpenseService(db)
    try:
        return service.update_expense(expense_id, expense_update)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(ExpenseItem).filter(ExpenseItem.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}

@router.get("/reports/monthly")
def get_monthly_report(month: int, year: int, db: Session = Depends(get_db)):
    service = ExpenseService(db)
    return service.get_monthly_report(month, year)