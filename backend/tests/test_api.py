import pytest
from datetime import date
from decimal import Decimal
from app.models.expense_category import ExpenseCategory, VATStatus
from app.models.location import Location, LocationType

class TestAPI:
    def test_health_endpoint(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}

    def test_create_location(self, client):
        location_data = {
            "name": "Home Office",
            "type": "WORK",
            "notes": "Main office location"
        }
        response = client.post("/api/locations/", json=location_data)
        assert response.status_code == 200

        data = response.json()
        assert data["name"] == "Home Office"
        assert data["type"] == "WORK"
        assert data["notes"] == "Main office location"

    def test_create_trip(self, client):
        trip_data = {
            "start_date": "2024-01-01",
            "end_date": "2024-01-03",
            "notes": "Business trip to London"
        }
        response = client.post("/api/trips/", json=trip_data)
        assert response.status_code == 200

        data = response.json()
        assert data["start_date"] == "2024-01-01"
        assert data["end_date"] == "2024-01-03"
        assert data["notes"] == "Business trip to London"

    def test_create_expense(self, client, db_session):
        category = ExpenseCategory(
            name="Train",
            vat_status=VATStatus.STANDARD
        )
        db_session.add(category)
        db_session.commit()

        expense_data = {
            "category_id": category.id,
            "date": "2024-01-01",
            "description": "Train to London",
            "amount_gbp": 120.0,
            "is_billable": True
        }
        response = client.post("/api/expenses/", json=expense_data)
        assert response.status_code == 200

        data = response.json()
        assert data["description"] == "Train to London"
        assert data["amount_gbp"] == 120.0
        assert data["ex_vat_amount"] == 100.0
        assert data["vat_amount"] == 20.0