from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional
from app.core.database import get_db
from app.models.evidence_item import EvidenceItem
from app.schemas.evidence_item import EvidenceItemResponse
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

@router.delete("/{file_id}")
def delete_file(file_id: int, db: Session = Depends(get_db)):
    evidence = db.query(EvidenceItem).filter(EvidenceItem.id == file_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="File not found")

    storage.delete_file(evidence.file_path)

    db.delete(evidence)
    db.commit()
    return {"message": "File deleted successfully"}