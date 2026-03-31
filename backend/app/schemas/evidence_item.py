from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class EvidenceItemBase(BaseModel):
    description: Optional[str] = None

class EvidenceItemCreate(EvidenceItemBase):
    pass

class EvidenceItemUpdate(BaseModel):
    description: Optional[str] = None

class EvidenceItemResponse(EvidenceItemBase):
    id: int
    file_path: str
    stored_filename: str
    original_filename: str
    file_type: str
    upload_date: date
    created_at: datetime

    class Config:
        from_attributes = True