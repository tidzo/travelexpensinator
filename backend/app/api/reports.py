from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.expense_service import ExpenseService
from app.services.pdf_service import PDFService

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/monthly/pdf")
def generate_monthly_report_pdf(month: int, year: int, db: Session = Depends(get_db)):
    expense_service = ExpenseService(db)
    pdf_service = PDFService()

    try:
        report_data = expense_service.get_monthly_report(month, year)
        pdf_buffer = pdf_service.generate_monthly_report(report_data)

        return Response(
            content=pdf_buffer.getvalue(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=monthly_report_{year}_{month:02d}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

@router.get("/evidence-binder/pdf")
def generate_evidence_binder_pdf(month: int, year: int, db: Session = Depends(get_db)):
    expense_service = ExpenseService(db)
    pdf_service = PDFService()

    try:
        report_data = expense_service.get_monthly_report(month, year)
        all_expenses = []

        for trip_group in report_data['trip_expenses']:
            all_expenses.extend(trip_group['expenses'])
        all_expenses.extend(report_data['unlinked_expenses'])

        pdf_buffer = pdf_service.generate_evidence_binder(all_expenses, month, year)

        return Response(
            content=pdf_buffer.getvalue(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=evidence_binder_{year}_{month:02d}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate evidence binder: {str(e)}")

@router.get("/combined/pdf")
def generate_combined_report_pdf(month: int, year: int, db: Session = Depends(get_db)):
    expense_service = ExpenseService(db)
    pdf_service = PDFService()

    try:
        report_data = expense_service.get_monthly_report(month, year)
        pdf_buffer = pdf_service.generate_combined_report(report_data)

        from datetime import date
        today = date.today()

        return Response(
            content=pdf_buffer.getvalue(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=expenses_{today.strftime('%Y_%m_%d')}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate combined PDF: {str(e)}")