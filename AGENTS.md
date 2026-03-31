# Travel Expense Manager - Agent Guide

This document helps AI agents (Claude Code or similar) understand and manage this travel expense management system.

## Project Overview

A UK contractor travel expense management application with:
- **Backend**: FastAPI + SQLAlchemy + SQLite/PostgreSQL
- **Frontend**: React + TypeScript + Material UI
- **Domain**: Travel expense tracking with VAT calculations and PDF reporting

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
- ExpenseItem MUST have `category_id`, `amount_gbp`, `date`
- ExpenseItem MUST have at least one of: `trip_id`, `journey_id`, `leg_id`, OR `is_monthly_expense=true`
- Deleting Trip cascades to Journeys, Legs, and ExpenseItems but NOT EvidenceItems

## Service Layer Business Logic

### TripService
- **create_trip()**: Automatically creates overnight expenses (£5/night)
- **update_trip()**: Recalculates overnight expenses if dates change
- Location: `app/services/trip_service.py:32`

### ExpenseService
- **create_expense()**: Auto-calculates VAT amounts based on category
- **get_monthly_report()**: Groups expenses by trip + unlinked expenses
- Location: `app/services/expense_service.py:15`

### VATCalculator
- **calculate_vat_amounts()**: 20% VAT for STANDARD, 0% for others
- Location: `app/services/vat_calculator.py:7`

### PDFService
- **generate_monthly_report()**: Creates expense report PDFs
- **generate_evidence_binder()**: Creates evidence table of contents
- Location: `app/services/pdf_service.py:12`

## API Endpoints Structure

### Main Routes
- `/api/trips` - Trip CRUD operations
- `/api/expenses` - Expense CRUD + monthly reports
- `/api/locations` - Location management
- `/api/files` - File upload/management
- `/api/reports` - PDF generation endpoints

### Key Endpoints
- `GET /api/expenses/reports/monthly?month=X&year=Y` - Monthly report data
- `GET /api/reports/monthly/pdf?month=X&year=Y` - PDF monthly report
- `POST /api/files/upload` - File upload with automatic naming

## Frontend Architecture

### Page Structure
- `TripsList.tsx` - Trip management with duration chips
- `ExpensesList.tsx` - Expense listing with VAT display
- `MonthlyReport.tsx` - Report view with PDF generation
- `Navigation.tsx` - Bottom navigation (mobile-friendly)

### Key Features
- Material UI responsive design
- Mobile-first bottom navigation
- Automatic currency formatting (GBP)
- File upload integration

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

### Dependencies
- **Runtime**: FastAPI, SQLAlchemy, Alembic, Pydantic, ReportLab
- **Dev**: pytest, black, ruff, mypy
- **Frontend**: React, TypeScript, Material UI, Vite

## Database Migrations

### Alembic Setup
- Config: `backend/alembic.ini`
- Migrations: `backend/migrations/versions/`
- Models import: All models in `app/models/__init__.py`

### Common Migration Tasks
```bash
cd backend
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head
```

## File Storage System

### Local Storage Implementation
- Base path: `uploads/`
- Structure: `uploads/YYYY/MM/filename`
- Naming: `{type}_{YYYY_MM_DD}_{description}.ext`
- Abstraction: `app/storage/storage_interface.py`

### Evidence File Types
Auto-detected from filename: train, hotel, meal, taxi, flight, expense

## Testing Strategy

### Test Structure
- `tests/conftest.py` - Test database setup
- `tests/test_vat_calculator.py` - VAT calculation tests
- `tests/test_trip_service.py` - Business logic tests
- `tests/test_api.py` - API endpoint tests

### Critical Tests
- VAT calculations (various rates and rounding)
- Overnight expense generation
- Trip date changes recalculating expenses
- File upload and storage

## Common Tasks for Agents

### Adding New Features
1. **Model Changes**: Update SQLAlchemy models + Pydantic schemas
2. **Business Logic**: Add to appropriate service class
3. **API**: Create/update FastAPI routes
4. **Frontend**: Add React components/pages
5. **Tests**: Add comprehensive test coverage

### Debugging Issues
1. **Check logs**: `make logs` or check individual service logs
2. **Database state**: Connect to SQLite and inspect tables
3. **API testing**: Use `/docs` endpoint for manual testing
4. **File uploads**: Check `uploads/` directory structure

### Database Schema Changes
1. Update model in `app/models/`
2. Generate migration: `uv run alembic revision --autogenerate -m "description"`
3. Review generated migration
4. Apply: `uv run alembic upgrade head`
5. Update Pydantic schemas if needed

### Performance Monitoring
- Watch for N+1 queries in SQLAlchemy relationships
- Monitor file upload sizes and storage usage
- Check PDF generation performance for large reports

## Security Considerations

### Current Implementation
- CORS configured for localhost development
- File upload validation by type
- SQL injection protection via SQLAlchemy ORM
- No authentication (single-user system)

### Future Security Enhancements
- Add authentication/authorization for multi-user
- Implement file upload size limits
- Add input validation for file types
- Secure file serving for production

## Deployment Notes

### Docker Production
- Multi-stage builds for smaller images
- Environment variable configuration
- PostgreSQL for production database
- Proper logging and monitoring

### AWS Deployment Preparation
- Storage abstraction ready for S3
- Database easily switchable to RDS
- Environment-based configuration
- API ready for load balancing

## Troubleshooting Common Issues

### Database Issues
- **Migration conflicts**: Check `alembic_version` table
- **Foreign key errors**: Verify relationship integrity
- **Missing tables**: Run `alembic upgrade head`

### File Upload Issues
- **Permission errors**: Check `uploads/` directory permissions
- **Path issues**: Verify directory structure creation
- **File naming**: Check auto-generation logic

### VAT Calculation Issues
- **Rounding errors**: Verify Decimal precision in calculations
- **Category VAT status**: Check expense category configuration
- **Overnight expenses**: Verify trip date calculations

## Extensions and Future Features

### Ready for Implementation
1. **Multi-user support**: Add user authentication and data isolation
2. **Email parsing**: Extract expenses from email receipts
3. **S3 storage**: Replace local storage with cloud storage
4. **Advanced reporting**: Additional report types and analytics
5. **API versioning**: Prepare for breaking changes

### Architecture Decisions
- Service layer pattern for business logic
- Repository pattern not used (direct SQLAlchemy access)
- File storage abstracted for future S3 migration
- React SPA with API-first backend
- Mobile-first responsive design

This guide should help any AI agent understand and effectively work with this travel expense management system.