from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import ValidationError
from app.core.database import get_db
from app.models.expense_item import ExpenseItem
from app.models.expense_category import ExpenseCategory
from app.models.expense_evidence_link import ExpenseEvidenceLink
from app.models.evidence_item import EvidenceItem
from app.schemas.expense_item import ExpenseItemCreate, ExpenseItemUpdate, ExpenseItemResponse
from app.schemas.evidence_item import EvidenceItemResponse
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
    journey_id: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    from sqlalchemy.orm import joinedload
    from sqlalchemy import func

    query = db.query(ExpenseItem).options(joinedload(ExpenseItem.evidence_links))

    if trip_id:
        query = query.filter(ExpenseItem.trip_id == trip_id)

    if journey_id:
        query = query.filter(ExpenseItem.journey_id == journey_id)

    if month and year:
        from sqlalchemy import extract
        query = query.filter(
            extract('month', ExpenseItem.date) == month,
            extract('year', ExpenseItem.date) == year
        )

    expenses = query.all()

    # Convert to response format with evidence count
    response_expenses = []
    for expense in expenses:
        expense_dict = {
            'id': expense.id,
            'trip_id': expense.trip_id,
            'journey_id': expense.journey_id,
            'leg_id': expense.leg_id,
            'category_id': expense.category_id,
            'date': expense.date,
            'description': expense.description,
            'amount_gbp': expense.amount_gbp,
            'ex_vat_amount': expense.ex_vat_amount,
            'vat_amount': expense.vat_amount,
            'is_billable': expense.is_billable,
            'is_monthly_expense': expense.is_monthly_expense,
            'created_at': expense.created_at,
            'updated_at': expense.updated_at,
            'evidence_count': len(expense.evidence_links)
        }
        response_expenses.append(expense_dict)

    return response_expenses

@router.get("/{expense_id}", response_model=ExpenseItemResponse)
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(ExpenseItem).filter(ExpenseItem.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

@router.put("/{expense_id}", response_model=ExpenseItemResponse)
async def update_expense(expense_id: int, request: Request, db: Session = Depends(get_db)):
    try:
        # Get raw request body and parse manually
        body = await request.body()
        import json
        data = json.loads(body)
        print(f"DEBUG: Raw data: {data}")

        # Create update object manually to avoid Pydantic issues
        from app.services.expense_service import ExpenseService
        service = ExpenseService(db)

        # Get the existing expense first
        existing_expense = db.query(ExpenseItem).filter(ExpenseItem.id == expense_id).first()
        if not existing_expense:
            raise HTTPException(status_code=404, detail="Expense not found")

        # Update fields directly on the existing expense
        if 'category_id' in data:
            existing_expense.category_id = data['category_id']
        if 'date' in data:
            if isinstance(data['date'], str):
                from datetime import date
                existing_expense.date = date.fromisoformat(data['date'])
            else:
                existing_expense.date = data['date']
        if 'description' in data:
            existing_expense.description = data['description']
        if 'amount_gbp' in data:
            existing_expense.amount_gbp = data['amount_gbp']
        if 'is_billable' in data:
            existing_expense.is_billable = data['is_billable']

        # Recalculate VAT
        from app.services.vat_calculator import VATCalculator
        category = db.query(ExpenseCategory).filter(ExpenseCategory.id == existing_expense.category_id).first()
        if category:
            ex_vat_amount, vat_amount = VATCalculator.calculate_vat_amounts(
                existing_expense.amount_gbp, category.vat_status
            )
            existing_expense.ex_vat_amount = ex_vat_amount
            existing_expense.vat_amount = vat_amount

        db.commit()
        db.refresh(existing_expense)
        return existing_expense

    except Exception as e:
        print(f"DEBUG: Exception: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(ExpenseItem).filter(ExpenseItem.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}

@router.get("/{expense_id}/evidence", response_model=List[EvidenceItemResponse])
def get_expense_evidence(expense_id: int, db: Session = Depends(get_db)):
    """Get all evidence items linked to a specific expense"""
    expense = db.query(ExpenseItem).filter(ExpenseItem.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    # Get evidence items through the expense_evidence_links table
    evidence_items = db.query(EvidenceItem).join(
        ExpenseEvidenceLink,
        EvidenceItem.id == ExpenseEvidenceLink.evidence_item_id
    ).filter(
        ExpenseEvidenceLink.expense_item_id == expense_id
    ).all()

    return evidence_items

@router.get("/reports/monthly")
def get_monthly_report(month: int, year: int, db: Session = Depends(get_db)):
    service = ExpenseService(db)
    return service.get_monthly_report(month, year)