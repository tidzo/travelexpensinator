# Travel Expense Manager

A personal travel expense management web application for UK contractors to plan and record work trips and produce monthly expense reports with VAT calculations and PDF evidence binders.

## Features

- **Trip Management**: Create and track business trips with automatic overnight expense calculations
- **Expense Tracking**: Record expenses with automatic VAT calculations
- **File Storage**: Upload and manage receipts and evidence files
- **Monthly Reports**: Generate detailed expense reports with VAT breakdowns
- **PDF Generation**: Create monthly reports and evidence binders as PDFs
- **Mobile-Friendly**: Responsive design for mobile and desktop use

## Tech Stack

### Backend
- Python 3.12
- FastAPI
- SQLAlchemy ORM
- Alembic migrations
- SQLite (easily switchable to PostgreSQL)
- Pydantic models
- ReportLab for PDF generation

### Frontend
- React 18
- TypeScript
- Material UI
- Vite
- Mobile-responsive design

### Infrastructure
- Docker & docker-compose
- uv for fast Python dependency management
- pyproject.toml for modern Python packaging
- Pytest for testing
- Black, Ruff, MyPy for code quality

## Quick Start

### Prerequisites
- Docker and docker-compose
- Make (optional, for convenience commands)
- For local development:
  - Python 3.12+
  - [uv](https://docs.astral.sh/uv/) for Python dependency management
  - Node.js 18+ for frontend

### Using Docker (Recommended)

1. Clone the repository
2. Start the development environment:
   ```bash
   make dev
   # or manually:
   docker-compose build
   docker-compose up -d
   ```

3. Access the applications:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Local Development

#### Backend Setup with uv
```bash
cd backend

# Install uv if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create virtual environment and install dependencies
uv sync

# For development dependencies (includes pytest, black, ruff, mypy)
uv sync --dev

# Run the development server
uv run uvicorn app.main:app --reload

# Run tests
uv run pytest tests/ -v

# Format code
uv run black .

# Lint code
uv run ruff check .

# Type checking
uv run mypy app/
```

#### Alternative: Traditional pip setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Available Commands

Use `make help` to see all available commands:

**Docker Commands:**
- `make build` - Build Docker containers
- `make up` - Start services
- `make down` - Stop services
- `make logs` - Show logs
- `make clean` - Clean up containers

**Development:**
- `make install-backend-dev` - Install backend with dev dependencies
- `make install-frontend` - Install frontend dependencies
- `make dev` - Quick start development environment

**Code Quality:**
- `make test` - Run all tests
- `make backend-test` - Run backend tests only
- `make format` - Format code with Black
- `make lint` - Lint code with Ruff
- `make typecheck` - Type check with MyPy

## Database Schema

The application follows a domain-driven design with the following key entities:

- **Trip**: Business trips with start/end dates
- **Journey**: Daily travel within a trip
- **Leg**: Individual transport segments
- **ExpenseItem**: Individual expenses with VAT calculations
- **ExpenseCategory**: Categorization with VAT status
- **Location**: Reusable locations (offices, hotels, stations)
- **EvidenceItem**: Uploaded files and receipts

## Business Logic

### Overnight Expenses
- Automatically calculated based on trip duration
- £5.00 per night (configurable)
- Marked as "Out of Scope" for VAT

### VAT Calculations
- Standard rate: 20% VAT
- Automatic ex-VAT and VAT amount calculations
- Support for zero-rated and out-of-scope expenses

### File Storage
- Organized by year/month structure
- Human-readable filenames with dates
- Abstracted storage layer (ready for S3 migration)

## Testing

```bash
# Run all tests
make test

# Backend tests only
cd backend && python -m pytest tests/ -v
```

## Architecture Notes

- **Domain-Driven Design**: Clean separation between domain logic and infrastructure
- **Service Layer**: Business logic encapsulated in service classes
- **Storage Abstraction**: File storage abstracted for future cloud migration
- **API-First**: REST API with automatic OpenAPI documentation
- **Type Safety**: Full TypeScript on frontend, Pydantic models on backend

## Future Enhancements

- Email parsing for automatic expense extraction
- Multi-user support with authentication
- AWS hosting with S3 storage
- Real-time synchronization
- Advanced reporting and analytics

## License

This project is ready to be open-sourced when needed.