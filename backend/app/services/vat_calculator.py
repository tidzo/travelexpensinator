from decimal import Decimal, ROUND_HALF_UP
from app.models.expense_category import VATStatus

class VATCalculator:
    VAT_RATE = Decimal("0.2")

    @classmethod
    def calculate_vat_amounts(cls, amount_gbp: Decimal, vat_status: VATStatus) -> tuple[Decimal, Decimal]:
        if vat_status == VATStatus.STANDARD:
            ex_vat_amount = (amount_gbp / (1 + cls.VAT_RATE)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            vat_amount = amount_gbp - ex_vat_amount
            return ex_vat_amount, vat_amount
        else:
            return amount_gbp, Decimal("0.00")