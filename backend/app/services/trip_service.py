from sqlalchemy.orm import Session
from datetime import date, timedelta
from decimal import Decimal
from app.models.trip import Trip
from app.models.journey import Journey
from app.models.expense_item import ExpenseItem
from app.models.expense_category import ExpenseCategory, VATStatus
from app.schemas.trip import TripCreate, TripUpdate

class TripService:
    def __init__(self, db: Session):
        self.db = db

    def create_trip(self, trip_data: TripCreate) -> Trip:
        trip = Trip(**trip_data.dict())
        self.db.add(trip)
        self.db.flush()

        # Create automatic journeys
        self._create_default_journeys(trip)

        self._create_overnight_expenses(trip)

        self.db.commit()
        self.db.refresh(trip)
        return trip

    def update_trip(self, trip_id: int, trip_data: TripUpdate) -> Trip:
        trip = self.db.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            raise ValueError(f"Trip {trip_id} not found")

        old_start = trip.start_date
        old_end = trip.end_date

        for field, value in trip_data.dict(exclude_unset=True).items():
            setattr(trip, field, value)

        if (trip_data.start_date and trip_data.start_date != old_start) or \
           (trip_data.end_date and trip_data.end_date != old_end):
            self._delete_overnight_expenses(trip)
            self._delete_default_journeys(trip)
            self._create_overnight_expenses(trip)
            self._create_default_journeys(trip)

        self.db.commit()
        self.db.refresh(trip)
        return trip

    def _create_default_journeys(self, trip: Trip):
        """Create default Outbound and Inbound journeys for a trip"""
        # Create Outbound journey on start date
        outbound_journey = Journey(
            trip_id=trip.id,
            date=trip.start_date,
            description="Outbound"
        )
        self.db.add(outbound_journey)

        # Only create Inbound journey if trip is more than one day
        if trip.end_date != trip.start_date:
            inbound_journey = Journey(
                trip_id=trip.id,
                date=trip.end_date,
                description="Inbound"
            )
            self.db.add(inbound_journey)

    def _delete_default_journeys(self, trip: Trip):
        """Delete default journeys (Outbound/Inbound) when trip dates change"""
        self.db.query(Journey).filter(
            Journey.trip_id == trip.id,
            Journey.description.in_(["Outbound", "Inbound"])
        ).delete()

    def _create_overnight_expenses(self, trip: Trip):
        incidental_category = self.db.query(ExpenseCategory).filter(
            ExpenseCategory.name == "Incidentals"
        ).first()

        if not incidental_category:
            return

        nights = (trip.end_date - trip.start_date).days

        for night in range(nights):
            expense_date = trip.start_date + timedelta(days=night)

            expense = ExpenseItem(
                trip_id=trip.id,
                category_id=incidental_category.id,
                date=expense_date,
                description="Incidental Overnight Expenses",
                amount_gbp=incidental_category.default_amount or Decimal("5.00"),
                ex_vat_amount=incidental_category.default_amount or Decimal("5.00"),
                vat_amount=Decimal("0.00"),
                is_billable=True
            )
            self.db.add(expense)

    def _delete_overnight_expenses(self, trip: Trip):
        incidental_category = self.db.query(ExpenseCategory).filter(
            ExpenseCategory.name == "Incidentals"
        ).first()

        if incidental_category:
            self.db.query(ExpenseItem).filter(
                ExpenseItem.trip_id == trip.id,
                ExpenseItem.category_id == incidental_category.id
            ).delete()