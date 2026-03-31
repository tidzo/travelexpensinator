from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import engine, Base
from app.api import trips, expenses, locations, files, reports, journeys, legs, expense_categories
# Import all models to ensure they're registered with Base
from app.models import *
import os

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize database with seed data
from app.core.init_db import init_db
init_db()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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

@app.get("/")
async def root():
    return {"message": "Travel Expense Manager API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}