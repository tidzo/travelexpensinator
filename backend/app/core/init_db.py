from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.expense_category import ExpenseCategory, VATStatus
from decimal import Decimal

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
                default_amount=Decimal("5.00")
            ),
            ExpenseCategory(name="Other", vat_status=VATStatus.ZERO_RATED),
        ]

        for category in categories:
            db.add(category)

        db.commit()
        print("Database initialized with seed data")

    except Exception as e:
        db.rollback()
        print(f"Error initializing database: {e}")
    finally:
        db.close()
