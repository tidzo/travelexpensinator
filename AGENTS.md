# Travel Expense Manager - Agent Guide

This document helps AI agents (Claude Code or similar) understand and manage this travel expense management system.

## Project Overview

A UK contractor travel expense management application with:
- **Backend**: FastAPI + SQLAlchemy + SQLite/PostgreSQL
- **Frontend**: React + TypeScript + Material UI
- **Domain**: Travel expense tracking with VAT calculations and PDF reporting

## Current System Architecture (Updated)

### Unified Interface Design
- **Single Expenses Page**: `/expenses` replaces separate `/trips` and `/expenses` pages
- **Dual Action Buttons**: "Add Trip" and "Add other expense" on main expenses page
- **Three-Tab Navigation**: Expenses | Locations | Reports (trips tab removed)
- **Trip Details Route**: `/expenses/trips/<id>` for individual trip management

### Core Navigation Flow
1. `/expenses` - Main page showing trips and other expenses with creation buttons
2. `/expenses/trips/<id>` - Trip detail page with journeys and trip-specific expenses
3. `/locations` - Location management
4. `/reports` - Combined PDF report generation

## Architecture & Design Patterns

### Domain-Driven Design Structure
```
backend/app/
├── models/          # SQLAlchemy domain models
├── schemas/         # Pydantic API models
├── services/        # Business logic layer
├── api/            # FastAPI route handlers
├── storage/        # File storage abstraction
└── core/           # Database and configuration
```

### Key Business Rules (CRITICAL)
1. **VAT Calculations**: Automatic 20% standard rate calculation
2. **Overnight Expenses**: £5.00 per night automatically generated for trips
3. **File Storage**: Organized by `uploads/YYYY/MM/filename` structure
4. **Expense Constraints**: Must belong to trip, journey, leg, OR be monthly expense
5. **Evidence Scaling**: Combined PDF uses additional 10% reduction for images

## Core Domain Models

### Entity Relationships
```
Trip (1:N) → Journey (1:N) → Leg (1:N) → ExpenseItem
Trip (1:N) → ExpenseItem (direct)
ExpenseItem (N:M) → EvidenceItem (via ExpenseEvidenceLink)
Location → Leg (origin/destination)
ExpenseCategory → ExpenseItem
```

### Critical Database Constraints
- ExpenseItem MUST have `category_id`, `amount_gbp`, `date`, `notes` (optional)
- ExpenseItem MUST have at least one of: `trip_id`, `journey_id`, `leg_id`, OR `is_monthly_expense=true`
- Deleting Trip cascades to Journeys, Legs, and ExpenseItems but NOT EvidenceItems
- Notes field added to ExpenseItem model for enhanced expense descriptions

## Service Layer Business Logic

### ExpenseService (Enhanced)
- **create_expense()**: Auto-calculates VAT amounts based on category
- **get_monthly_report()**: Groups expenses by trip + unlinked expenses
- **get_expense_description_with_notes()**: Combines expense and leg notes for reporting
- Location: `app/services/expense_service.py:15`

### PDFService (Major Update)
- **generate_monthly_report()**: Creates standard monthly report PDFs
- **generate_evidence_binder()**: Creates evidence table of contents
- **generate_combined_report()**: NEW - Creates single PDF with monthly report + evidence binder
- **_embed_evidence_file_scaled()**: NEW - Evidence embedding with additional 10% scaling
- Location: `app/services/pdf_service.py:12`

### VATCalculator
- **calculate_vat_amounts()**: 20% VAT for STANDARD, 0% for others
- Location: `app/services/vat_calculator.py:7`

## API Endpoints Structure

### Main Routes (Updated)
- `/api/trips` - Trip CRUD operations
- `/api/expenses` - Expense CRUD + monthly reports
- `/api/locations` - Location management
- `/api/files` - File upload/management
- `/api/reports` - PDF generation endpoints

### Key Endpoints (Updated)
- `GET /api/expenses/reports/monthly?month=X&year=Y` - Monthly report data
- `GET /api/reports/monthly/pdf?month=X&year=Y` - PDF monthly report (legacy)
- `GET /api/reports/evidence-binder/pdf?month=X&year=Y` - PDF evidence binder (legacy)
- `GET /api/reports/combined/pdf?month=X&year=Y` - NEW Combined PDF report
- `POST /api/files/upload` - File upload with automatic naming

## Frontend Architecture (Streamlined)

### Page Structure (Updated)
- `TripsList.tsx` - Unified expenses view showing trips and other expenses
- `TripDetail.tsx` - Individual trip management (route: `/expenses/trips/<id>`)
- `MonthlyReport.tsx` - Report view with single "Generate Report PDF" button
- `Navigation.tsx` - Three-tab bottom navigation (Expenses, Locations, Reports)
- `ExpenseDialog.tsx` - Shared component for all expense creation/editing

### Key Features (Updated)
- Single expenses page with dual creation buttons
- Consolidated expense notes support throughout application
- Material UI responsive design optimized for expense workflow
- Mobile-first bottom navigation with streamlined tabs
- Automatic currency formatting (GBP)
- File upload integration with evidence linking

### Component Integration
- **ExpenseDialog**: Shared between TripsList and TripDetail for consistent UX
- **Navigation**: Removed trips tab, consolidated to expenses-focused workflow
- **TripsList**: Now shows "Expenses in Month Year" and contains both trips and other expenses
- **MonthlyReport**: Single PDF button replaces separate monthly/evidence buttons

## Enhanced PDF Generation System

### Combined PDF Architecture
```javascript
// Frontend: Single button generates combined report
handleGenerateCombinedPDF() → /api/reports/combined/pdf

// Backend: Combined PDF generation
generate_combined_report() {
  monthly_report_content +
  page_break +
  evidence_binder_content_with_scaling
}
```

### PDF Content Structure
1. **Title**: "Expenses Report: Month YYYY"
2. **Summary**: VAT breakdown table (no billable/non-billable line)
3. **Details**: Trip expenses and other expenses
4. **Evidence Binder**: Embedded images/PDFs with 10% additional scaling

### Evidence Optimization
- **Scaling**: Base 10% reduction + additional 10% for combined reports (19% total reduction)
- **Margins**: Standard document margins for professional appearance
- **Deduplication**: Smart evidence ordering prevents duplicate presentation
- **File Types**: Support for images (PNG, JPG) and PDFs with quality optimization

## Development Environment

### Modern Python Setup (uv)
```bash
cd backend
uv sync --dev           # Install with dev dependencies
uv run pytest tests/    # Run tests
uv run black .          # Format code
uv run ruff check .     # Lint code
uv run mypy app/        # Type check
```

### Docker Setup
```bash
make dev                # Start everything
make test               # Run tests
make clean              # Clean up
```

### Dependencies (Updated)
- **Runtime**: FastAPI, SQLAlchemy, Alembic, Pydantic, ReportLab, PyMuPDF, Pillow
- **Dev**: pytest, black, ruff, mypy
- **Frontend**: React, TypeScript, Material UI, Vite, React Router

## Database Schema (Enhanced)

### Recent Schema Updates
- **ExpenseItem.notes**: Added optional text field for expense notes
- **Expense Description Enhancement**: Service layer combines expense notes with leg notes
- **Evidence Linking**: Maintains existing many-to-many relationship structure

### Migration Handling
- Manual SQL execution required for adding columns to existing SQLite databases
- Database files: `/backend/data/app.db` (main) and `/frontend/data/app.db` (backup/legacy)

## Testing Strategy (Updated Focus Areas)

### Critical Tests (Updated)
- Combined PDF generation functionality
- Evidence scaling and embedding in reports
- Expense notes integration throughout system
- Unified expenses page functionality
- Navigation flow between expenses and trip details
- VAT calculations (various rates and rounding)
- File upload and evidence linking

### Test Coverage Areas
- PDF service combined report generation
- Expense service notes integration
- Frontend component integration (ExpenseDialog shared usage)
- Navigation routing for updated URL structure

## Common Tasks for Agents (Updated)

### Current System Modifications
1. **PDF Enhancements**: Modify `generate_combined_report()` for layout changes
2. **UI Improvements**: Update TripsList.tsx for expenses page functionality
3. **Evidence Optimization**: Adjust scaling factors in `_embed_evidence_file_scaled()`
4. **Navigation Updates**: Modify Navigation.tsx for tab structure changes
5. **Database Updates**: Handle expense notes field and related functionality

### Debugging Current System
1. **PDF Generation Issues**: Check combined PDF endpoint and scaling functions
2. **Navigation Problems**: Verify route changes from `/trips` to `/expenses/trips/<id>`
3. **Expense Creation**: Debug ExpenseDialog integration across different contexts
4. **Evidence Display**: Check evidence scaling and embedding in combined reports

## Security Considerations (Current State)

### Implemented Security
- CORS configured for localhost development
- File upload validation by type
- SQL injection protection via SQLAlchemy ORM
- No authentication (single-user system)

### Evidence File Security
- File path validation for evidence embedding
- Error handling for missing or corrupted evidence files
- Safe file type detection and processing

## Key System Changes Made

### Navigation Simplification
- Removed `/trips` route entirely
- Consolidated to `/expenses` as main entry point
- Updated trip details route to `/expenses/trips/<id>`
- Reduced navigation tabs from 4 to 3

### PDF Generation Revolution
- Combined monthly report and evidence binder into single document
- Implemented professional "Expenses Report" formatting
- Added optimized evidence scaling for space efficiency
- Automatic date-based file naming

### User Experience Enhancements
- Dual action buttons for trip and expense creation
- Unified expense notes support throughout application
- Streamlined interface focusing on core expense workflow
- Enhanced evidence management with better scaling

### Backend Service Evolution
- Enhanced ExpenseService with notes integration
- Advanced PDFService with combined report generation
- Improved evidence file handling and optimization
- Maintained backward compatibility for existing functionality

This guide reflects the current state of the travel expense management system after recent major updates focusing on user experience streamlining and enhanced PDF reporting capabilities.