import logging
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.config import settings
from app.models.expense_category import ExpenseCategory, VATStatus
from decimal import Decimal

logger = logging.getLogger(__name__)

def init_db():
    """Initialize database with seed data"""
    db: Session = SessionLocal()

    try:
        # Check if categories already exist
        existing_categories = db.query(ExpenseCategory).count()
        if existing_categories > 0:
            return

        # Create default expense categories
        categories = [
            ExpenseCategory(name="Travel", vat_status=VATStatus.ZERO_RATED),
            ExpenseCategory(name="Accommodation", vat_status=VATStatus.STANDARD),
            ExpenseCategory(name="Subsistence", vat_status=VATStatus.STANDARD),
            ExpenseCategory(
                name="Incidentals",
                vat_status=VATStatus.OUT_OF_SCOPE,
                default_amount=Decimal(str(settings.default_incidental_amount))
            ),
            ExpenseCategory(name="Other", vat_status=VATStatus.ZERO_RATED),
        ]

        for category in categories:
            db.add(category)

        db.commit()
        logger.info("Database initialized with seed data")

    except Exception as e:
        db.rollback()
        logger.error(f"Error initializing database: {e}")
    finally:
        db.close()
