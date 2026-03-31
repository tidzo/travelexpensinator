import pytest
from datetime import date, timedelta
from decimal import Decimal
from app.models.trip import Trip
from app.models.expense_category import ExpenseCategory, VATStatus
from app.models.expense_item import ExpenseItem
from app.schemas.trip import TripCreate, TripUpdate
from app.services.trip_service import TripService

class TestTripService:
    def test_create_trip_with_overnight_expenses(self, db_session):
        incidental_category = ExpenseCategory(
            name="Incidental Overnight Expenses",
            vat_status=VATStatus.OUT_OF_SCOPE,
            default_amount=Decimal("5.00")
        )
        db_session.add(incidental_category)
        db_session.commit()

        trip_service = TripService(db_session)
        trip_data = TripCreate(
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 3),
            notes="Test trip"
        )

        trip = trip_service.create_trip(trip_data)

        assert trip.id is not None
        assert trip.start_date == date(2024, 1, 1)
        assert trip.end_date == date(2024, 1, 3)

        overnight_expenses = db_session.query(ExpenseItem).filter(
            ExpenseItem.trip_id == trip.id,
            ExpenseItem.category_id == incidental_category.id
        ).all()

        assert len(overnight_expenses) == 2

    def test_update_trip_recalculates_overnight_expenses(self, db_session):
        incidental_category = ExpenseCategory(
            name="Incidental Overnight Expenses",
            vat_status=VATStatus.OUT_OF_SCOPE,
            default_amount=Decimal("5.00")
        )
        db_session.add(incidental_category)
        db_session.commit()

        trip_service = TripService(db_session)
        trip_data = TripCreate(
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 3)
        )

        trip = trip_service.create_trip(trip_data)

        update_data = TripUpdate(end_date=date(2024, 1, 5))
        updated_trip = trip_service.update_trip(trip.id, update_data)

        overnight_expenses = db_session.query(ExpenseItem).filter(
            ExpenseItem.trip_id == trip.id,
            ExpenseItem.category_id == incidental_category.id
        ).all()

        assert len(overnight_expenses) == 4
        assert updated_trip.end_date == date(2024, 1, 5)