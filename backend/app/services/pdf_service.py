from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether, CondPageBreak
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
    # PDF Layout Constants
    MAX_PDF_PAGES = 5  # Maximum pages to include from a single PDF document
    PDF_RENDER_ZOOM = 1.5  # Zoom level for PDF rendering quality
    PDF_SCALE_REDUCTION = 0.9  # Reduction factor for PDF scaling (90%)
    MAX_IMAGE_WIDTH = 7.5 * inch  # Maximum width for embedded images
    MAX_IMAGE_HEIGHT = 10 * inch  # Maximum height for embedded images

    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=20,  # Reduced from 30
        )
        self.heading4_style = ParagraphStyle(
            'CustomHeading4',
            parent=self.styles['Heading2'],
            fontSize=11,
            spaceBefore=6,
            spaceAfter=6,
        )
        # Add compact evidence header style
        self.evidence_header_style = ParagraphStyle(
            'EvidenceHeader',
            parent=self.styles['Heading3'],
            fontSize=12,
            spaceBefore=6,
            spaceAfter=8,
        )
        # Add style for wrapped descriptions in tables
        self.description_style = ParagraphStyle(
            'DescriptionStyle',
            parent=self.styles['Normal'],
            fontSize=9,
            leading=11,
            spaceAfter=0,
            spaceBefore=0,
        )
        # Add italic style for trip notes
        self.trip_notes_style = ParagraphStyle(
            'TripNotesStyle',
            parent=self.styles['Normal'],
            fontSize=10,
            fontName='Helvetica-Oblique',
            spaceAfter=0,
            spaceBefore=0,
        )

    def _format_description_with_notes(self, description: str) -> Any:
        """Format expense description, making notes (after newline) italic if present"""
        if '\n' in description:
            # Split main description and notes
            parts = description.split('\n', 1)
            main_desc = parts[0]
            notes = parts[1]

            # Create formatted description with italic notes
            formatted_desc = f"{main_desc}<br/><i>{notes}</i>"
            return Paragraph(formatted_desc, self.description_style)
        else:
            # No notes, handle normal word wrapping
            if len(description) > 35:
                return Paragraph(description, self.description_style)
            else:
                return description

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
                story.extend(self._create_trip_section(trip_group))
                story.append(Spacer(1, 12))

        if report_data['unlinked_expenses']:
            story.append(Paragraph("Other Expenses", self.styles['Heading2']))
            story.append(Spacer(1, 12))

            # Apply orphan control for unlinked expenses table
            unlinked_table = self._create_expense_table(report_data['unlinked_expenses'])
            num_unlinked_rows = len(report_data['unlinked_expenses'])

            if num_unlinked_rows <= 2:
                # Small table - keep together with section header
                story.append(KeepTogether([unlinked_table]))
            else:
                # Larger table - add normally with splitting enabled
                story.append(unlinked_table)

        doc.build(story)
        buffer.seek(0)
        return buffer

    def generate_evidence_binder(self, expenses: List[ExpenseItem], month: int, year: int) -> BytesIO:
        buffer = BytesIO()
        # Use smaller margins for the evidence binder
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=0.5*inch,    # Reduced from default ~1 inch
            rightMargin=0.5*inch,   # Reduced from default ~1 inch
            topMargin=0.4*inch,     # Reduced from default ~1 inch
            bottomMargin=0.4*inch   # Reduced from default ~1 inch
        )
        story = []

        title = f"Evidence Binder - {self._get_month_name(month)} {year}"
        story.append(Paragraph(title, self.title_style))
        story.append(Spacer(1, 6))  # Reduced from 12

        # Track which evidence items have already been presented to avoid duplication
        presented_evidence_ids = set()
        evidence_count = 0

        # Process expenses in the order they appear (preserving web report ordering)
        # Present evidence items when first encountered
        for expense in expenses:
            for link in expense.evidence_links:
                evidence_id = link.evidence_item.id

                # Skip if this evidence item has already been presented
                if evidence_id in presented_evidence_ids:
                    continue

                presented_evidence_ids.add(evidence_id)
                evidence_count += 1

                # Start each evidence item on a new page (except the first)
                if evidence_count > 1:
                    story.append(PageBreak())

                evidence = link.evidence_item

                # Collect all expenses linked to this evidence item, maintaining expense ordering
                linked_expenses = []
                seen_expense_ids = set()
                for exp in expenses:
                    if exp.id in seen_expense_ids:
                        continue
                    for exp_link in exp.evidence_links:
                        if exp_link.evidence_item.id == evidence_id:
                            linked_expenses.append(exp)
                            seen_expense_ids.add(exp.id)
                            break

                # Create expense table showing all expenses linked to this evidence
                expense_data = [['Date', 'Description', 'Amount']]
                for linked_expense in linked_expenses:
                    # Format description with notes in italics if present
                    description_formatted = self._format_description_with_notes(linked_expense.description)
                    expense_data.append([
                        linked_expense.date.strftime('%d/%m/%Y'),
                        description_formatted,
                        f"£{linked_expense.amount_gbp:.2f}"
                    ])

                expense_table = Table(expense_data, colWidths=[1*inch, 5.5*inch, 1*inch])
                expense_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 8),
                    ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('TOPPADDING', (0, 0), (-1, -1), 3),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 3)
                ]))

                # Configure table splitting to prevent orphans
                expense_table.splitByRow = True
                expense_table.repeatRows = 1  # Repeat header row on each page

                # For small tables (3 rows or fewer), try to keep together
                # For larger tables, allow splitting but prevent orphans
                num_data_rows = len(expense_data) - 1  # Subtract header row
                if num_data_rows <= 2:
                    # Small table - try to keep together with a conditional page break
                    story.append(KeepTogether([expense_table]))
                else:
                    # Larger table - allow splitting but set minimum rows at bottom/top
                    expense_table.minRowHeights = [None] * len(expense_data)
                    story.append(expense_table)
                story.append(Spacer(1, 12))

                # Include the actual evidence file
                try:
                    # Handle both cases: file_path with or without 'uploads/' prefix
                    if evidence.file_path.startswith('uploads/'):
                        file_path = Path(evidence.file_path)
                    else:
                        file_path = Path("uploads") / evidence.file_path

                    if file_path.exists():
                        story.extend(self._embed_evidence_file(file_path, evidence.file_type))
                    else:
                        story.append(Paragraph(f"File not found: {evidence.file_path} (looked at: {file_path})", self.styles['Normal']))
                except Exception as e:
                    story.append(Paragraph(f"Error loading file: {str(e)}", self.styles['Normal']))

        if evidence_count == 0:
            story.append(Paragraph("No evidence items found for this period.", self.styles['Normal']))

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

    def _embed_evidence_file_scaled(self, file_path: Path, file_type: str, extra_scale: float = 1.0):
        """Embed evidence file with additional scaling"""
        story_elements = []

        try:
            if file_type and file_type.lower().startswith('image'):
                # Handle image files with extra scaling
                story_elements.extend(self._embed_image_scaled(file_path, extra_scale))
            elif file_type and 'pdf' in file_type.lower():
                # Handle PDF files with extra scaling
                story_elements.extend(self._embed_pdf_scaled(file_path, extra_scale))
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

                # Calculate scaling to fit on page (with smaller margins)
                max_width = 7.5 * inch  # A4 width minus smaller margins (8.27 - 1.0 = 7.27, rounded to 7.5)
                max_height = 10 * inch  # A4 height minus smaller margins (11.69 - 0.8 = 10.89, rounded to 10)

                img_width, img_height = img.size
                scale = min(max_width / img_width, max_height / img_height, 1.0)

                # Reduce scaling by 10%
                scale = scale * 0.9

                final_width = img_width * scale
                final_height = img_height * scale

                # Create reportlab Image
                image = Image(str(file_path), width=final_width, height=final_height)
                story_elements.append(image)

        except Exception as e:
            story_elements.append(Paragraph(f"Error loading image: {str(e)}", self.styles['Normal']))

        return story_elements

    def _embed_image_scaled(self, file_path: Path, extra_scale: float = 1.0):
        """Embed an image file into the PDF with additional scaling"""
        story_elements = []

        try:
            # Open and process the image
            with PILImage.open(file_path) as img:
                # Convert to RGB if necessary
                if img.mode != 'RGB':
                    img = img.convert('RGB')

                # Calculate scaling to fit on page (with smaller margins)
                max_width = 7.5 * inch  # A4 width minus smaller margins
                max_height = 10 * inch  # A4 height minus smaller margins

                img_width, img_height = img.size
                scale = min(max_width / img_width, max_height / img_height, 1.0)

                # Reduce scaling by 10% (original reduction)
                scale = scale * 0.9

                # Apply additional scaling
                scale = scale * extra_scale

                final_width = img_width * scale
                final_height = img_height * scale

                # Create reportlab Image
                image = Image(str(file_path), width=final_width, height=final_height)
                story_elements.append(image)

        except Exception as e:
            story_elements.append(Paragraph(f"Error loading image: {str(e)}", self.styles['Normal']))

        return story_elements

    def _embed_pdf(self, file_path: Path, extra_scale: float = 1.0, image_format: str = 'JPEG'):
        """
        Embed pages from a PDF file as images into the current PDF.

        Args:
            file_path: Path to the PDF file
            extra_scale: Additional scaling factor (default 1.0 = no extra scaling)
            image_format: Image format to use ('JPEG' or 'PNG')
        """
        story_elements = []

        try:
            # Open the PDF document
            doc = fitz.open(str(file_path))
            num_pages = len(doc)

            # Limit pages to prevent very large evidence binders
            max_pages = min(num_pages, self.MAX_PDF_PAGES)

            if num_pages > max_pages:
                story_elements.append(
                    Paragraph(
                        f"PDF file has {num_pages} pages. Only first {max_pages} pages will be included.",
                        self.styles['Normal']
                    )
                )
                story_elements.append(Spacer(1, 6))

            # Convert each page to an image and embed it
            for page_num in range(max_pages):
                page = doc[page_num]

                # Render page as image (matrix controls resolution)
                matrix = fitz.Matrix(self.PDF_RENDER_ZOOM, self.PDF_RENDER_ZOOM)
                pix = page.get_pixmap(matrix=matrix)

                # Convert to PIL Image
                img_data = pix.tobytes("ppm")
                img = PILImage.open(BytesIO(img_data))

                # Calculate scaling to fit on page
                img_width, img_height = img.size
                scale = min(
                    self.MAX_IMAGE_WIDTH / img_width,
                    self.MAX_IMAGE_HEIGHT / img_height,
                    1.0
                )

                # Apply standard reduction and extra scaling
                scale = scale * self.PDF_SCALE_REDUCTION * extra_scale

                final_width = img_width * scale
                final_height = img_height * scale

                # Save to temporary buffer for ReportLab
                img_buffer = BytesIO()
                if image_format == 'JPEG':
                    img.save(img_buffer, format='JPEG', quality=85)
                else:
                    img.save(img_buffer, format='PNG')
                img_buffer.seek(0)

                # Create reportlab Image
                rl_image = Image(img_buffer, width=final_width, height=final_height)
                story_elements.append(rl_image)

                # Add spacing between pages (except after last page)
                if page_num < max_pages - 1:
                    story_elements.append(Spacer(1, 12))

            doc.close()

        except Exception as e:
            story_elements.append(Paragraph(f"Error processing PDF: {str(e)}", self.styles['Normal']))

        return story_elements

    # Keep _embed_pdf_scaled as a compatibility wrapper
    def _embed_pdf_scaled(self, file_path: Path, extra_scale: float = 1.0):
        """Legacy method - use _embed_pdf with extra_scale parameter instead"""
        return self._embed_pdf(file_path, extra_scale=extra_scale, image_format='PNG')

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

    def _create_trip_section(self, trip_group: Dict[str, Any]) -> List:
        trip = trip_group['trip']
        expenses = trip_group['expenses']

        trip_title = self._format_trip_name(trip.start_date, trip.end_date)

        story_elements = []

        # Add trip title
        story_elements.append(Paragraph(trip_title, self.heading4_style))

        # Add trip notes if they exist
        if trip.notes and trip.notes.strip():
            story_elements.append(Paragraph(trip.notes, self.trip_notes_style))
            story_elements.append(Spacer(1, 6))
        else:
            story_elements.append(Spacer(1, 6))

        def format_amount(amount):
            return f"£{amount:.2f}" if amount > 0 else ""

        data = [['Date', 'Description', 'Net (ex VAT)', 'VAT', 'Gross (Paid)']]
        for expense in expenses:
            # Format description with notes in italics
            description_para = self._format_description_with_notes(expense.description)

            data.append([
                expense.date.strftime('%Y-%m-%d'),
                description_para,
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
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP')  # Align content to top of cells
        ]))

        # Configure table splitting to prevent orphans
        table.splitByRow = True
        table.repeatRows = 1  # Repeat header row on each page

        # Always keep trip title and notes with the table
        num_data_rows = len(data) - 1  # Subtract header row

        if num_data_rows <= 2:
            # Small trip table - keep everything together (title, notes, and table)
            return [KeepTogether(story_elements + [table])]
        elif num_data_rows <= 5:
            # Medium trip table - keep title/notes with table, but allow table to split if absolutely necessary
            return [KeepTogether(story_elements + [table])]
        else:
            # Larger trip table - at minimum, keep title and notes with the table header and first row
            # This prevents the title from being orphaned on a previous page
            result = []

            # Add a conditional page break before the trip section if there's not enough space
            # for at least the title, any notes, and a few table rows
            min_space_needed = 2 * inch  # Estimate space needed for title + header + 1-2 rows
            result.append(CondPageBreak(min_space_needed))

            # Add all story elements (title, notes, spacers) followed by the table
            result.extend(story_elements)
            result.append(table)

            return result

    def _create_expense_table(self, expenses: List[ExpenseItem]) -> Table:
        def format_amount(amount):
            return f"£{amount:.2f}" if amount > 0 else ""

        data = [['Date', 'Description', 'Net (ex VAT)', 'VAT', 'Gross (Paid)']]
        for expense in expenses:
            # Format description with notes in italics
            description_para = self._format_description_with_notes(expense.description)

            data.append([
                expense.date.strftime('%Y-%m-%d'),
                description_para,
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
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP')  # Align content to top of cells
        ]))

        # Configure table splitting to prevent orphans
        table.splitByRow = True
        table.repeatRows = 1  # Repeat header row on each page

        return table

    def _get_month_name(self, month: int) -> str:
        months = [
            'January', 'February', 'March', 'April',
            'May', 'June', 'July', 'August',
            'September', 'October', 'November', 'December'
        ]
        return months[month - 1]

    def _format_trip_name(self, start_date, end_date) -> str:
        from datetime import datetime

        start = datetime.strptime(str(start_date), '%Y-%m-%d')
        end = datetime.strptime(str(end_date), '%Y-%m-%d')

        start_day_short = start.strftime('%a')  # Short day name
        end_day_short = end.strftime('%a')
        start_day = start.day
        end_day = end.day
        month_name = start.strftime('%B')  # Full month name

        return f"Trip: {start_day_short} {start_day} - {end_day_short} {end_day} {month_name}"

    def generate_combined_report(self, report_data: Dict[str, Any]) -> BytesIO:
        """Generate a combined PDF with monthly report followed by evidence binder"""
        buffer = BytesIO()
        # Use default margins (back to original)
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []

        month = report_data['month']
        year = report_data['year']

        # First section: Monthly Report
        story.extend(self._build_monthly_report_content(report_data))

        # Page break between sections
        story.append(PageBreak())

        # Second section: Evidence Binder
        all_expenses = []
        for trip_group in report_data['trip_expenses']:
            all_expenses.extend(trip_group['expenses'])
        all_expenses.extend(report_data['unlinked_expenses'])

        story.extend(self._build_evidence_binder_content(all_expenses, month, year))

        # Build the combined PDF
        doc.build(story)
        buffer.seek(0)
        return buffer

    def _build_monthly_report_content(self, report_data: Dict[str, Any]) -> List:
        """Build the monthly report content as story elements"""
        story = []
        month = report_data['month']
        year = report_data['year']

        # Title
        story.append(Paragraph(f"Expenses Report: {self._get_month_name(month)} {year}", self.title_style))

        # Summary subtitle
        story.append(Paragraph("Summary", self.styles['Heading2']))
        story.append(Spacer(1, 10))

        # Summary table
        totals = report_data['totals']
        def format_amount(amount):
            return f"£{amount:.2f}" if amount > 0 else ""

        summary_data = [
            ['Category', 'Net (ex VAT)', 'VAT', 'Gross (Paid)'],
            ['Standard Rated',
             format_amount(totals['standard_rated_gross'] - totals['standard_rated_vat']),
             format_amount(totals['standard_rated_vat']),
             format_amount(totals['standard_rated_gross'])],
            ['Zero-Rated or Out of Scope',
             format_amount(totals['zero_rated'] + totals['out_of_scope']),
             format_amount(0),
             format_amount(totals['zero_rated'] + totals['out_of_scope'])],
            ['TOTAL',
             f"£{(totals['standard_rated_gross'] - totals['standard_rated_vat']) + (totals['zero_rated'] + totals['out_of_scope']):.2f}",
             format_amount(totals['standard_rated_vat']),
             f"£{totals['total_expenses']:.2f}"]
        ]

        summary_table = Table(summary_data, colWidths=[2*inch, 1.5*inch, 1*inch, 1.5*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))

        story.append(summary_table)
        story.append(Spacer(1, 15))

        # Details section
        if report_data['trip_expenses']:
            story.append(Paragraph("Details", self.styles['Heading2']))
            story.append(Spacer(1, 10))

            for trip_group in report_data['trip_expenses']:
                story.extend(self._create_trip_section(trip_group))
                story.append(Spacer(1, 12))

        # Other expenses
        if report_data['unlinked_expenses']:
            story.append(Paragraph("Other Expenses", self.styles['Heading2']))
            story.append(Spacer(1, 10))

            data = [['Date', 'Description', 'Net (ex VAT)', 'VAT', 'Gross (Paid)']]
            for expense in report_data['unlinked_expenses']:
                description_para = self._format_description_with_notes(expense.description)
                data.append([
                    expense.date.strftime('%Y-%m-%d'),
                    description_para,
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
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'TOP')
            ]))

            story.append(table)

        return story

    def _add_evidence_header(self, story: List, month: int, year: int) -> None:
        """Add the evidence binder title and header"""
        story.append(Paragraph(f"Evidence Binder - {self._get_month_name(month)} {year}", self.title_style))
        story.append(Spacer(1, 6))

    def _create_expense_table_for_evidence(self, linked_expenses: List[ExpenseItem]) -> Table:
        """Create a table showing expenses linked to an evidence item"""
        expense_data = [['Date', 'Description', 'Amount']]
        for expense in linked_expenses:
            description_formatted = self._format_description_with_notes(expense.description)
            expense_data.append([
                expense.date.strftime('%d/%m/%Y'),
                description_formatted,
                f"£{expense.amount_gbp:.2f}"
            ])

        expense_table = Table(expense_data, colWidths=[1*inch, 5.5*inch, 1*inch])
        expense_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3)
        ]))

        return expense_table

    def _add_evidence_file(self, story: List, evidence) -> None:
        """Add the evidence file (image or PDF) to the story"""
        try:
            # Handle both cases: file_path with or without 'uploads/' prefix
            if evidence.file_path.startswith('uploads/'):
                file_path = Path(evidence.file_path)
            else:
                file_path = Path("uploads") / evidence.file_path

            if file_path.exists():
                story.extend(self._embed_evidence_file_scaled(file_path, evidence.file_type, extra_scale=0.9))
            else:
                story.append(Paragraph(f"File not found: {evidence.file_path} (looked at: {file_path})", self.styles['Normal']))
        except Exception as e:
            story.append(Paragraph(f"Error loading file: {str(e)}", self.styles['Normal']))

    def _build_evidence_binder_content(self, expenses: List[ExpenseItem], month: int, year: int) -> List:
        """Build the evidence binder content as story elements"""
        story = []

        # Add header
        self._add_evidence_header(story, month, year)

        if not expenses:
            story.append(Paragraph("No evidence items found for this period.", self.styles['Normal']))
            return story

        # Track which evidence items have already been presented to avoid duplication
        presented_evidence_ids = set()
        evidence_count = 0

        # Process expenses in the order they appear (preserving web report ordering)
        for expense in expenses:
            for link in expense.evidence_links:
                evidence_id = link.evidence_item.id

                # Skip if this evidence item has already been presented
                if evidence_id in presented_evidence_ids:
                    continue

                presented_evidence_ids.add(evidence_id)
                evidence_count += 1

                # Start each evidence item on a new page (except the first)
                if evidence_count > 1:
                    story.append(PageBreak())

                evidence = link.evidence_item

                # Collect all expenses linked to this evidence item
                linked_expenses = []
                seen_expense_ids = set()
                for exp in expenses:
                    if exp.id in seen_expense_ids:
                        continue
                    for exp_link in exp.evidence_links:
                        if exp_link.evidence_item.id == evidence_id:
                            linked_expenses.append(exp)
                            seen_expense_ids.add(exp.id)
                            break

                # Create and add expense table
                expense_table = self._create_expense_table_for_evidence(linked_expenses)
                num_data_rows = len(linked_expenses)
                if num_data_rows <= 2:
                    story.append(KeepTogether([expense_table]))
                else:
                    story.append(expense_table)
                story.append(Spacer(1, 12))

                # Add the evidence file
                self._add_evidence_file(story, evidence)

        return story

