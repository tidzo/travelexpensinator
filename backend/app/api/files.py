from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional
from app.core.database import get_db
from app.models.evidence_item import EvidenceItem
from app.models.expense_item import ExpenseItem
from app.models.expense_evidence_link import ExpenseEvidenceLink
from app.schemas.evidence_item import EvidenceItemResponse
from app.schemas.expense_item import ExpenseItemResponse
from app.storage.local_storage import LocalStorage

router = APIRouter(prefix="/files", tags=["files"])
storage = LocalStorage()

@router.post("/upload", response_model=EvidenceItemResponse)
def upload_file(
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    upload_date: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        upload_date_obj = date.fromisoformat(upload_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    file_path, stored_filename = storage.store_file(
        file.file,
        file.filename,
        file.content_type,
        upload_date_obj
    )

    evidence = EvidenceItem(
        file_path=file_path,
        stored_filename=stored_filename,
        original_filename=file.filename,
        file_type=file.content_type,
        upload_date=upload_date_obj,
        description=description
    )

    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    return evidence

@router.get("/", response_model=List[EvidenceItemResponse])
def list_files(db: Session = Depends(get_db)):
    return db.query(EvidenceItem).all()

@router.get("/{file_id}", response_model=EvidenceItemResponse)
def get_file(file_id: int, db: Session = Depends(get_db)):
    evidence = db.query(EvidenceItem).filter(EvidenceItem.id == file_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="File not found")
    return evidence

@router.get("/{file_id}/expenses", response_model=List[ExpenseItemResponse])
def get_file_expenses(file_id: int, db: Session = Depends(get_db)):
    """Get all expenses linked to a specific evidence file"""
    evidence = db.query(EvidenceItem).filter(EvidenceItem.id == file_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence item not found")

    # Get expense items through the expense_evidence_links table
    from sqlalchemy.orm import joinedload
    expenses = db.query(ExpenseItem).options(joinedload(ExpenseItem.evidence_links)).join(
        ExpenseEvidenceLink,
        ExpenseItem.id == ExpenseEvidenceLink.expense_item_id
    ).filter(
        ExpenseEvidenceLink.evidence_item_id == file_id
    ).all()

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

@router.delete("/{file_id}")
def delete_file(file_id: int, db: Session = Depends(get_db)):
    evidence = db.query(EvidenceItem).filter(EvidenceItem.id == file_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="File not found")

    storage.delete_file(evidence.file_path)

    db.delete(evidence)
    db.commit()
    return {"message": "File deleted successfully"}