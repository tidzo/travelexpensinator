import pytest
from decimal import Decimal
from app.services.vat_calculator import VATCalculator
from app.models.expense_category import VATStatus

class TestVATCalculator:
    def test_standard_vat_calculation(self):
        amount = Decimal("120.00")
        ex_vat, vat = VATCalculator.calculate_vat_amounts(amount, VATStatus.STANDARD)

        assert ex_vat == Decimal("100.00")
        assert vat == Decimal("20.00")

    def test_zero_rated_vat_calculation(self):
        amount = Decimal("100.00")
        ex_vat, vat = VATCalculator.calculate_vat_amounts(amount, VATStatus.ZERO_RATED)

        assert ex_vat == Decimal("100.00")
        assert vat == Decimal("0.00")

    def test_out_of_scope_vat_calculation(self):
        amount = Decimal("100.00")
        ex_vat, vat = VATCalculator.calculate_vat_amounts(amount, VATStatus.OUT_OF_SCOPE)

        assert ex_vat == Decimal("100.00")
        assert vat == Decimal("0.00")

    def test_rounding_precision(self):
        amount = Decimal("119.99")
        ex_vat, vat = VATCalculator.calculate_vat_amounts(amount, VATStatus.STANDARD)

        assert ex_vat == Decimal("99.99")
        assert vat == Decimal("20.00")