from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.expense_evidence_link import ExpenseEvidenceLink
from pydantic import BaseModel

router = APIRouter(prefix="/expense-evidence-links", tags=["expense-evidence-links"])

class ExpenseEvidenceLinkCreate(BaseModel):
    expense_item_id: int
    evidence_item_id: int

@router.post("/")
def create_expense_evidence_link(
    link_data: ExpenseEvidenceLinkCreate,
    db: Session = Depends(get_db)
):
    """Create a link between an expense and evidence item"""
    # Check if link already exists
    existing_link = db.query(ExpenseEvidenceLink).filter(
        ExpenseEvidenceLink.expense_item_id == link_data.expense_item_id,
        ExpenseEvidenceLink.evidence_item_id == link_data.evidence_item_id
    ).first()

    if existing_link:
        raise HTTPException(status_code=400, detail="Link already exists")

    # Create new link
    db_link = ExpenseEvidenceLink(
        expense_item_id=link_data.expense_item_id,
        evidence_item_id=link_data.evidence_item_id
    )

    db.add(db_link)
    db.commit()

    return {"message": "Link created successfully"}

@router.delete("/{expense_item_id}/{evidence_item_id}")
def delete_expense_evidence_link(
    expense_item_id: int,
    evidence_item_id: int,
    db: Session = Depends(get_db)
):
    """Delete a link between an expense and evidence item"""
    db_link = db.query(ExpenseEvidenceLink).filter(
        ExpenseEvidenceLink.expense_item_id == expense_item_id,
        ExpenseEvidenceLink.evidence_item_id == evidence_item_id
    ).first()

    if not db_link:
        raise HTTPException(status_code=404, detail="Link not found")

    db.delete(db_link)
    db.commit()

    return {"message": "Link deleted successfully"}