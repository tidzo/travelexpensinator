from sqlalchemy import Column, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class ExpenseEvidenceLink(Base):
    __tablename__ = "expense_evidence_links"

    expense_item_id = Column(ForeignKey("expense_items.id"), primary_key=True)
    evidence_item_id = Column(ForeignKey("evidence_items.id"), primary_key=True)

    expense_item = relationship("ExpenseItem", back_populates="evidence_links")
    evidence_item = relationship("EvidenceItem", back_populates="expense_links")