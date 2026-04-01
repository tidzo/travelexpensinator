# Travel Expense Manager

A comprehensive travel expense tracking and reporting application built with FastAPI (backend) and React with TypeScript (frontend).

## Features

### Core Functionality
- **Trip Management**: Create and organize business trips with start/end dates and notes
- **Journey Tracking**: Break trips into individual journeys with transport details
- **Transport Legs**: Record specific transport segments (train, plane, taxi, etc.) with locations and notes
- **Expense Tracking**: Comprehensive expense management with VAT calculations
- **Evidence Management**: Upload and link receipts/evidence to expenses
- **Monthly Reporting**: Generate detailed expense reports with VAT breakdowns
- **PDF Generation**: Create professional PDF reports and evidence binders

### Expense Categories & VAT
- Automatic VAT calculations based on category settings
- Support for Standard Rated, Zero Rated, and Out of Scope VAT categories
- Billable vs non-billable expense tracking
- Smart categorization for common travel expenses

### Navigation & UI
- **Responsive Design**: Material-UI based interface optimized for mobile and desktop
- **Date-based Navigation**: Month/year selectors for filtering data
- **Bottom Navigation**: Quick access to main sections (Expenses, Locations, Reports)
- **Smart Routing**: Intuitive URL structure for easy navigation

## Technology Stack

### Backend (FastAPI)
- **FastAPI**: Modern, fast web framework for APIs
- **SQLAlchemy**: Database ORM with SQLite for development
- **ReportLab**: PDF generation for reports and evidence binders
- **PyMuPDF**: PDF processing for evidence handling
- **Pillow**: Image processing and optimization
- **Uvicorn**: ASGI server for development

### Frontend (React + TypeScript)
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe JavaScript for better development experience
- **Material-UI**: Google Material Design component library
- **React Router**: Client-side routing and navigation
- **Vite**: Fast build tool and development server

### File Structure
```
/backend           - FastAPI backend application
  /app
    /api           - API route handlers
    /models        - SQLAlchemy database models
    /services      - Business logic and services
    /core          - Database configuration and utilities
/frontend          - React TypeScript frontend
  /src
    /components    - Reusable React components
    /pages         - Main application pages
    /services      - API client and utilities
    /contexts      - React context providers
```

## Key Pages & Features

### Main Navigation
- **Expenses** (`/expenses`): Unified view of all trips and other expenses with creation buttons
- **Locations** (`/locations`): Manage frequently used locations
- **Reports** (`/reports`): Generate comprehensive expense reports

### Trip & Expense Management
- **Trip Details** (`/expenses/trips/<id>`): Detailed trip view with journeys and expenses
- **Unified Expense Creation**: Single dialog for all expense types with notes support
- **Evidence Linking**: Upload receipts and link to multiple expenses
- **Smart Categorization**: Automatic VAT calculation based on expense categories

### Reporting & PDF Generation
- **Combined PDF Reports**: Single document containing expenses summary and evidence binder
- **Professional Layout**: Clean "Expenses Report: Month YYYY" format with Summary and Details sections
- **Evidence Binder**: Embedded images and PDFs with smart deduplication and optimized scaling
- **VAT Compliance**: Proper VAT breakdowns for UK business requirements
- **Automated Naming**: Files download as `expenses_YYYY_MM_DD.pdf`

## Setup & Development

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Database
The application uses SQLite for data storage with automatic table creation. Database files are stored in `/backend/data/`.

## Usage

1. **Create Trips**: Add business trips with dates and notes via "Add Trip" button
2. **Add Other Expenses**: Record standalone expenses via "Add other expense" button
3. **Manage Trip Details**: Click on trips to add journeys, transport legs, and trip-specific expenses
4. **Upload Evidence**: Attach receipts and documentation to any expense
5. **Generate Reports**: Single "Generate Report PDF" button creates comprehensive expense reports

## Current System Architecture

### Unified Expenses View
- Single `/expenses` page replaces separate trips and expenses pages
- Shows both trips and standalone "Other Expenses" in one view
- Dual action buttons: "Add Trip" and "Add other expense"

### Streamlined Navigation
- Three-tab bottom navigation: **Expenses** | **Locations** | **Reports**
- Trip details accessible via `/expenses/trips/<id>`
- Date selectors persist across pages for month/year filtering

### Enhanced PDF Generation
- Single combined PDF with expenses summary followed by evidence binder
- Optimized evidence scaling for maximum page utilization
- Professional formatting with Summary and Details sections
- Automatic file naming with current date

## Recent Updates

- Consolidated trip and expense management into unified `/expenses` page
- Removed redundant navigation tabs, focusing on core expense workflow
- Implemented combined PDF generation with enhanced evidence layout
- Added comprehensive notes support throughout expense management
- Improved evidence ordering and deduplication in reports
- Streamlined user interface with focus on essential expense tracking features