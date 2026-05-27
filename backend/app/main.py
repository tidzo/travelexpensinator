from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging
import os

logger = logging.getLogger(__name__)
from app.core.config import settings
from app.core.database import engine, Base
from app.core.init_db import init_db
from app.api import trips, expenses, locations, files, reports, journeys, legs, expense_categories, expense_evidence_links
# Import all models to ensure they're registered with Base
from app.models.trip import Trip
from app.models.journey import Journey
from app.models.leg import Leg
from app.models.expense_item import ExpenseItem
from app.models.expense_category import ExpenseCategory
from app.models.evidence_item import EvidenceItem
from app.models.expense_evidence_link import ExpenseEvidenceLink
from app.models.location import Location

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize database with seed data
init_db()

app = FastAPI(title=settings.app_name)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    body = await request.body()
    logger.error("422 on %s %s | body: %s | errors: %s", request.method, request.url.path, body.decode(), exc.errors())
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(trips.router, prefix="/api")
app.include_router(journeys.router, prefix="/api")
app.include_router(legs.router, prefix="/api")
app.include_router(expenses.router, prefix="/api")
app.include_router(expense_categories.router, prefix="/api")
app.include_router(locations.router, prefix="/api")
app.include_router(files.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(expense_evidence_links.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Travel Expense Manager API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}