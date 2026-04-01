from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.expense_service import ExpenseService
from app.services.pdf_service import PDFService

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/combined/pdf")
def generate_combined_report_pdf(month: int, year: int, db: Session = Depends(get_db)):
    expense_service = ExpenseService(db)
    pdf_service = PDFService()

    try:
        report_data = expense_service.get_monthly_report(month, year)
        pdf_buffer = pdf_service.generate_combined_report(report_data)

        return Response(
            content=pdf_buffer.getvalue(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=expenses_{year}_{month:02d}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate combined PDF: {str(e)}")