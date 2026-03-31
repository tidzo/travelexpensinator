from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from io import BytesIO
from decimal import Decimal
from typing import Dict, Any, List
from app.models.expense_item import ExpenseItem

class PDFService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
        )

    def generate_monthly_report(self, report_data: Dict[str, Any]) -> BytesIO:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []

        title = f"Monthly Expense Report - {self._get_month_name(report_data['month'])} {report_data['year']}"
        story.append(Paragraph(title, self.title_style))
        story.append(Spacer(1, 12))

        story.append(self._create_summary_table(report_data['totals']))
        story.append(Spacer(1, 24))

        if report_data['trip_expenses']:
            story.append(Paragraph("Trip Expenses", self.styles['Heading2']))
            story.append(Spacer(1, 12))

            for trip_group in report_data['trip_expenses']:
                story.append(self._create_trip_section(trip_group))
                story.append(Spacer(1, 12))

        if report_data['unlinked_expenses']:
            story.append(Paragraph("Other Expenses", self.styles['Heading2']))
            story.append(Spacer(1, 12))
            story.append(self._create_expense_table(report_data['unlinked_expenses']))

        doc.build(story)
        buffer.seek(0)
        return buffer

    def generate_evidence_binder(self, expenses: List[ExpenseItem], month: int, year: int) -> BytesIO:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []

        title = f"Evidence Binder - {self._get_month_name(month)} {year}"
        story.append(Paragraph(title, self.title_style))
        story.append(Spacer(1, 12))

        story.append(Paragraph("Table of Contents", self.styles['Heading2']))
        story.append(Spacer(1, 12))

        evidence_items = []
        for expense in expenses:
            for link in expense.evidence_links:
                evidence_items.append({
                    'date': expense.date,
                    'description': expense.description,
                    'amount': expense.amount_gbp,
                    'evidence': link.evidence_item
                })

        evidence_items.sort(key=lambda x: x['date'])

        toc_data = [['Date', 'Description', 'Amount', 'Evidence File']]
        for item in evidence_items:
            toc_data.append([
                item['date'].strftime('%Y-%m-%d'),
                item['description'],
                f"£{item['amount']:.2f}",
                item['evidence'].original_filename
            ])

        toc_table = Table(toc_data)
        toc_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))

        story.append(toc_table)

        doc.build(story)
        buffer.seek(0)
        return buffer

    def _create_summary_table(self, totals: Dict[str, Decimal]) -> Table:
        data = [
            ['VAT Category', 'Amount'],
            ['Standard Rated (Gross)', f"£{totals['standard_rated_gross']:.2f}"],
            ['Standard Rated (VAT)', f"£{totals['standard_rated_vat']:.2f}"],
            ['Zero Rated', f"£{totals['zero_rated']:.2f}"],
            ['Out of Scope', f"£{totals['out_of_scope']:.2f}"],
            ['', ''],
            ['Total Expenses', f"£{totals['total_expenses']:.2f}"],
            ['Billable Total', f"£{totals['billable_total']:.2f}"],
            ['Non-Billable Total', f"£{totals['non_billable_total']:.2f}"],
        ]

        table = Table(data, colWidths=[3*inch, 2*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
            ('BACKGROUND', (0, -3), (-1, -1), colors.lightgrey),
            ('FONTNAME', (0, -3), (-1, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))

        return table

    def _create_trip_section(self, trip_group: Dict[str, Any]) -> Table:
        trip = trip_group['trip']
        expenses = trip_group['expenses']

        trip_title = f"Trip {trip.id} ({trip.start_date} to {trip.end_date})"

        data = [['Date', 'Description', 'Amount']]
        for expense in expenses:
            data.append([
                expense.date.strftime('%Y-%m-%d'),
                expense.description,
                f"£{expense.amount_gbp:.2f}"
            ])

        table = Table(data, colWidths=[1.5*inch, 3*inch, 1.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))

        return table

    def _create_expense_table(self, expenses: List[ExpenseItem]) -> Table:
        data = [['Date', 'Description', 'Amount']]
        for expense in expenses:
            data.append([
                expense.date.strftime('%Y-%m-%d'),
                expense.description,
                f"£{expense.amount_gbp:.2f}"
            ])

        table = Table(data, colWidths=[1.5*inch, 3*inch, 1.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))

        return table

    def _get_month_name(self, month: int) -> str:
        months = [
            'January', 'February', 'March', 'April',
            'May', 'June', 'July', 'August',
            'September', 'October', 'November', 'December'
        ]
        return months[month - 1]