from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader
from io import BytesIO
from decimal import Decimal
from typing import Dict, Any, List
from app.models.expense_item import ExpenseItem
import os
from pathlib import Path
from PIL import Image as PILImage
import fitz  # PyMuPDF for better PDF handling

class PDFService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
        )
        self.heading4_style = ParagraphStyle(
            'CustomHeading4',
            parent=self.styles['Heading2'],
            fontSize=11,
            spaceBefore=6,
            spaceAfter=6,
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

        # Create a dictionary to group expenses by evidence item
        evidence_groups = {}
        for expense in expenses:
            for link in expense.evidence_links:
                evidence_id = link.evidence_item.id
                if evidence_id not in evidence_groups:
                    evidence_groups[evidence_id] = {
                        'evidence': link.evidence_item,
                        'expenses': []
                    }
                evidence_groups[evidence_id]['expenses'].append(expense)

        if not evidence_groups:
            story.append(Paragraph("No evidence items found for this period.", self.styles['Normal']))
            doc.build(story)
            buffer.seek(0)
            return buffer

        # Sort evidence groups by upload date
        sorted_evidence = sorted(evidence_groups.values(), key=lambda x: x['evidence'].upload_date)

        # Process each evidence item
        for i, evidence_group in enumerate(sorted_evidence):
            if i > 0:
                story.append(PageBreak())  # Start each evidence item on a new page

            evidence = evidence_group['evidence']

            # Evidence header with filename
            story.append(Paragraph(evidence.original_filename, self.styles['Heading2']))
            story.append(Spacer(1, 12))

            # Linked expenses table (simple format)
            expense_data = [['Date', 'Description', 'Amount']]
            for expense in sorted(evidence_group['expenses'], key=lambda x: x.date):
                expense_data.append([
                    expense.date.strftime('%d/%m/%Y'),
                    expense.description,
                    f"£{expense.amount_gbp:.2f}"
                ])

            expense_table = Table(expense_data, colWidths=[1.2*inch, 3.8*inch, 1*inch])
            expense_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
            ]))

            story.append(expense_table)
            story.append(Spacer(1, 20))

            # Include the actual evidence file
            try:
                # Handle both cases: file_path with or without 'uploads/' prefix
                if evidence.file_path.startswith('uploads/'):
                    # File path already includes uploads/ prefix
                    file_path = Path(evidence.file_path)
                else:
                    # File path is relative to uploads directory
                    file_path = Path("uploads") / evidence.file_path

                if file_path.exists():
                    story.extend(self._embed_evidence_file(file_path, evidence.file_type))
                else:
                    story.append(Paragraph(f"File not found: {evidence.file_path} (looked at: {file_path})", self.styles['Normal']))
            except Exception as e:
                story.append(Paragraph(f"Error loading file: {str(e)}", self.styles['Normal']))

        doc.build(story)
        buffer.seek(0)
        return buffer

    def _embed_evidence_file(self, file_path: Path, file_type: str):
        """Embed the actual evidence file content into the PDF"""
        story_elements = []

        try:
            if file_type and file_type.lower().startswith('image'):
                # Handle image files
                story_elements.extend(self._embed_image(file_path))
            elif file_type and 'pdf' in file_type.lower():
                # Handle PDF files
                story_elements.extend(self._embed_pdf(file_path))
            else:
                # For other file types, show a placeholder
                story_elements.append(Paragraph(f"File type not supported for inline display: {file_type}", self.styles['Normal']))
                story_elements.append(Paragraph(f"File location: {file_path}", self.styles['Normal']))

        except Exception as e:
            story_elements.append(Paragraph(f"Error processing file: {str(e)}", self.styles['Normal']))

        return story_elements

    def _embed_image(self, file_path: Path):
        """Embed an image file into the PDF"""
        story_elements = []

        try:
            # Open and process the image
            with PILImage.open(file_path) as img:
                # Convert to RGB if necessary
                if img.mode != 'RGB':
                    img = img.convert('RGB')

                # Calculate scaling to fit on page (with margins)
                max_width = 6.5 * inch  # A4 width minus margins
                max_height = 8 * inch   # Available height

                img_width, img_height = img.size
                scale = min(max_width / img_width, max_height / img_height, 1.0)

                final_width = img_width * scale
                final_height = img_height * scale

                # Create reportlab Image
                image = Image(str(file_path), width=final_width, height=final_height)
                story_elements.append(image)

        except Exception as e:
            story_elements.append(Paragraph(f"Error loading image: {str(e)}", self.styles['Normal']))

        return story_elements

    def _embed_pdf(self, file_path: Path):
        """Embed pages from a PDF file as images into the current PDF"""
        story_elements = []

        try:
            # Open the PDF document
            doc = fitz.open(str(file_path))
            num_pages = len(doc)

            # Limit pages to prevent very large evidence binders
            max_pages = min(num_pages, 5)  # Limit to 5 pages per document

            if num_pages > max_pages:
                story_elements.append(Paragraph(f"PDF file has {num_pages} pages. Only first {max_pages} pages will be included.", self.styles['Normal']))

            story_elements.append(Paragraph(f"PDF Document ({max_pages} page{'s' if max_pages != 1 else ''}):", self.styles['Normal']))
            story_elements.append(Spacer(1, 12))

            # Convert each page to an image and embed it
            for page_num in range(max_pages):
                page = doc[page_num]

                # Render page as image (matrix controls resolution)
                matrix = fitz.Matrix(1.5, 1.5)  # 1.5x zoom for good quality
                pix = page.get_pixmap(matrix=matrix)

                # Convert to PIL Image
                img_data = pix.tobytes("ppm")
                img = PILImage.open(BytesIO(img_data))

                # Calculate scaling to fit on page
                max_width = 6.5 * inch
                max_height = 8 * inch

                img_width, img_height = img.size
                scale = min(max_width / img_width, max_height / img_height, 1.0)

                final_width = img_width * scale
                final_height = img_height * scale

                # Convert PIL Image to BytesIO for reportlab
                img_buffer = BytesIO()
                img.save(img_buffer, format='JPEG', quality=85)
                img_buffer.seek(0)

                # Create reportlab Image
                rl_image = Image(img_buffer, width=final_width, height=final_height)

                if page_num > 0:
                    story_elements.append(Spacer(1, 12))
                story_elements.append(Paragraph(f"Page {page_num + 1}:", self.styles['Normal']))
                story_elements.append(Spacer(1, 6))
                story_elements.append(rl_image)

            doc.close()

        except Exception as e:
            story_elements.append(Paragraph(f"Error processing PDF: {str(e)}", self.styles['Normal']))

        return story_elements

    def _create_summary_table(self, totals: Dict[str, Decimal]) -> Table:
        # Calculate net amounts (ex VAT)
        standard_net = totals['standard_rated_gross'] - totals['standard_rated_vat']
        zero_or_oos_net = totals['zero_rated'] + totals['out_of_scope']
        total_net = standard_net + zero_or_oos_net
        total_vat = totals['standard_rated_vat']
        total_gross = totals['total_expenses']

        # Helper function to format amounts (blank if zero)
        def format_amount(amount):
            return f"£{amount:.2f}" if amount > 0 else ""

        data = [
            ['Category', 'Net (ex VAT)', 'VAT', 'Gross (Paid)'],
            ['Standard Rated', format_amount(standard_net), format_amount(totals['standard_rated_vat']), format_amount(totals['standard_rated_gross'])],
            ['Zero-Rated or Out of Scope', format_amount(zero_or_oos_net), format_amount(0), format_amount(zero_or_oos_net)],
            ['TOTAL', f"£{total_net:.2f}", format_amount(total_vat), f"£{total_gross:.2f}"],
        ]

        table = Table(data, colWidths=[2.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),  # Category column left-aligned
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),  # Amount columns right-aligned
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),  # Header row bold
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),  # Total row bold
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -2), colors.beige),  # Data rows
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),  # Total row
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))

        return table

    def _create_trip_section(self, trip_group: Dict[str, Any]) -> Table:
        trip = trip_group['trip']
        expenses = trip_group['expenses']

        trip_title = f"Trip {trip.id} ({trip.start_date} to {trip.end_date})"

        def format_amount(amount):
            return f"£{amount:.2f}" if amount > 0 else ""

        data = [['Date', 'Description', 'Net (ex VAT)', 'VAT', 'Gross (Paid)']]
        for expense in expenses:
            data.append([
                expense.date.strftime('%Y-%m-%d'),
                expense.description,
                format_amount(expense.ex_vat_amount),
                format_amount(expense.vat_amount),
                f"£{expense.amount_gbp:.2f}"
            ])

        table = Table(data, colWidths=[1*inch, 2*inch, 1*inch, 1*inch, 1*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (1, -1), 'LEFT'),
            ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))

        return table

    def _create_expense_table(self, expenses: List[ExpenseItem]) -> Table:
        def format_amount(amount):
            return f"£{amount:.2f}" if amount > 0 else ""

        data = [['Date', 'Description', 'Net (ex VAT)', 'VAT', 'Gross (Paid)']]
        for expense in expenses:
            data.append([
                expense.date.strftime('%Y-%m-%d'),
                expense.description,
                format_amount(expense.ex_vat_amount),
                format_amount(expense.vat_amount),
                f"£{expense.amount_gbp:.2f}"
            ])

        table = Table(data, colWidths=[1*inch, 2*inch, 1*inch, 1*inch, 1*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (1, -1), 'LEFT'),
            ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
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