from sqlalchemy import Column, Integer, String, Date, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class EvidenceItem(Base):
    __tablename__ = "evidence_items"

    id = Column(Integer, primary_key=True, index=True)
    file_path = Column(String, nullable=False)
    stored_filename = Column(String, nullable=False, unique=True)
    original_filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    upload_date = Column(Date, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    expense_links = relationship("ExpenseEvidenceLink", back_populates="evidence_item", cascade="all, delete-orphan")