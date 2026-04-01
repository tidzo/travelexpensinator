from sqlalchemy.orm import Session
from sqlalchemy import and_, extract, func, case
from decimal import Decimal
from datetime import date
from typing import Dict, Any
from app.models.expense_item import ExpenseItem
from app.models.expense_category import ExpenseCategory, VATStatus
from app.models.trip import Trip
from app.schemas.expense_item import ExpenseItemCreate, ExpenseItemUpdate
from app.services.vat_calculator import VATCalculator

class ExpenseService:
    def __init__(self, db: Session):
        self.db = db

    def create_expense(self, expense_data: ExpenseItemCreate) -> ExpenseItem:
        category = self.db.query(ExpenseCategory).filter(
            ExpenseCategory.id == expense_data.category_id
        ).first()

        if not category:
            raise ValueError(f"Category {expense_data.category_id} not found")

        ex_vat_amount, vat_amount = VATCalculator.calculate_vat_amounts(
            expense_data.amount_gbp, category.vat_status
        )

        # Convert to dict and check if this should be a monthly expense
        expense_dict = expense_data.dict()

        # If no trip, journey, or leg is specified, this should be a monthly expense
        if not expense_dict.get('trip_id') and not expense_dict.get('journey_id') and not expense_dict.get('leg_id'):
            expense_dict['is_monthly_expense'] = True

        expense = ExpenseItem(
            **expense_dict,
            ex_vat_amount=ex_vat_amount,
            vat_amount=vat_amount
        )

        self.db.add(expense)
        self.db.commit()
        self.db.refresh(expense)
        return expense

    def update_expense(self, expense_id: int, expense_data: ExpenseItemUpdate) -> ExpenseItem:
        expense = self.db.query(ExpenseItem).filter(ExpenseItem.id == expense_id).first()
        if not expense:
            raise ValueError(f"Expense {expense_id} not found")

        update_data = expense_data.dict(exclude_unset=True)

        if "amount_gbp" in update_data or "category_id" in update_data:
            category_id = update_data.get("category_id", expense.category_id)
            category = self.db.query(ExpenseCategory).filter(
                ExpenseCategory.id == category_id
            ).first()

            if not category:
                raise ValueError(f"Category {category_id} not found")

            amount = update_data.get("amount_gbp", expense.amount_gbp)
            ex_vat_amount, vat_amount = VATCalculator.calculate_vat_amounts(
                amount, category.vat_status
            )
            update_data["ex_vat_amount"] = ex_vat_amount
            update_data["vat_amount"] = vat_amount

        for field, value in update_data.items():
            setattr(expense, field, value)

        self.db.commit()
        self.db.refresh(expense)
        return expense

    def get_monthly_report(self, month: int, year: int) -> Dict[str, Any]:
        from sqlalchemy.orm import joinedload
        expenses = self.db.query(ExpenseItem).join(ExpenseCategory).options(
            joinedload(ExpenseItem.leg)
        ).filter(
            and_(
                extract('month', ExpenseItem.date) == month,
                extract('year', ExpenseItem.date) == year
            )
        ).all()

        grouped_by_trip = {}
        unlinked_expenses = []

        for expense in expenses:
            # Enhance description with leg notes if applicable
            expense.description = self.get_expense_description_with_notes(expense)

            if expense.trip_id:
                if expense.trip_id not in grouped_by_trip:
                    grouped_by_trip[expense.trip_id] = {
                        "trip": expense.trip,
                        "expenses": []
                    }
                grouped_by_trip[expense.trip_id]["expenses"].append(expense)
            else:
                unlinked_expenses.append(expense)

        totals = self._calculate_totals(expenses)

        # Sort trip expenses by trip start date (ascending - earliest first)
        trip_expenses = list(grouped_by_trip.values())
        trip_expenses.sort(key=lambda x: x["trip"].start_date, reverse=False)

        # Sort expenses within each trip by date first, then by logical order within each day
        for trip_group in trip_expenses:
            trip = trip_group["trip"]

            def expense_sort_key(expense):
                is_transport_leg = expense.leg_id is not None
                is_first_day = expense.date == trip.start_date
                is_last_day = expense.date == trip.end_date

                # On first day: transport legs (0) then other expenses (1)
                # On last day: other expenses (0) then transport legs (1)
                # On middle days: other expenses (0) then transport legs (1)
                if is_first_day:
                    expense_type_priority = 0 if is_transport_leg else 1
                else:  # last day or middle days
                    expense_type_priority = 1 if is_transport_leg else 0

                return (expense.date, expense_type_priority)

            trip_group["expenses"].sort(key=expense_sort_key, reverse=False)

        return {
            "month": month,
            "year": year,
            "trip_expenses": trip_expenses,
            "unlinked_expenses": unlinked_expenses,
            "totals": totals
        }

    def _calculate_totals(self, expenses) -> Dict[str, Decimal]:
        totals = {
            "standard_rated_gross": Decimal("0.00"),
            "standard_rated_vat": Decimal("0.00"),
            "zero_rated": Decimal("0.00"),
            "out_of_scope": Decimal("0.00"),
            "total_expenses": Decimal("0.00"),
            "billable_total": Decimal("0.00"),
            "non_billable_total": Decimal("0.00")
        }

        for expense in expenses:
            if expense.category.vat_status == VATStatus.STANDARD:
                totals["standard_rated_gross"] += expense.amount_gbp
                totals["standard_rated_vat"] += expense.vat_amount
            elif expense.category.vat_status == VATStatus.ZERO_RATED:
                totals["zero_rated"] += expense.amount_gbp
            else:
                totals["out_of_scope"] += expense.amount_gbp

            totals["total_expenses"] += expense.amount_gbp

            if expense.is_billable:
                totals["billable_total"] += expense.amount_gbp
            else:
                totals["non_billable_total"] += expense.amount_gbp

        return totals

    def get_expense_description_with_notes(self, expense: ExpenseItem) -> str:
        """Get expense description including leg notes if applicable"""
        description = expense.description

        # If this expense is linked to a leg and the leg has notes, append them
        if expense.leg_id and expense.leg and expense.leg.notes:
            # Check if notes are already in description (for newly created legs)
            if '\n' not in description:
                description += f"\n{expense.leg.notes}"

        return description