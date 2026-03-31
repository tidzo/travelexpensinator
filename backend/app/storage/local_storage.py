import os
import shutil
from pathlib import Path
from typing import BinaryIO
from datetime import date
from app.storage.storage_interface import StorageInterface
import re

class LocalStorage(StorageInterface):
    def __init__(self, base_path: str = "uploads"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(exist_ok=True)

    def store_file(self, file: BinaryIO, original_filename: str, file_type: str, upload_date: date) -> tuple[str, str]:
        safe_filename = self._create_safe_filename(original_filename, upload_date)

        year_dir = self.base_path / str(upload_date.year)
        month_dir = year_dir / f"{upload_date.month:02d}"
        month_dir.mkdir(parents=True, exist_ok=True)

        file_path = month_dir / safe_filename

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file, buffer)

        relative_path = str(file_path.relative_to(self.base_path))

        return relative_path, safe_filename

    def delete_file(self, file_path: str) -> bool:
        try:
            os.remove(file_path)
            return True
        except FileNotFoundError:
            return False

    def get_file_url(self, file_path: str) -> str:
        return f"/uploads/{file_path}"

    def _create_safe_filename(self, original_filename: str, upload_date: date) -> str:
        name, ext = os.path.splitext(original_filename)

        safe_name = re.sub(r'[^\w\-_.]', '_', name.lower())
        safe_name = re.sub(r'_+', '_', safe_name).strip('_')

        date_str = upload_date.strftime("%Y_%m_%d")

        inferred_type = self._infer_expense_type(safe_name)

        return f"{inferred_type}_{date_str}_{safe_name}{ext}"

    def _infer_expense_type(self, filename: str) -> str:
        filename_lower = filename.lower()

        if any(word in filename_lower for word in ['train', 'rail', 'journey']):
            return 'train'
        elif any(word in filename_lower for word in ['hotel', 'accommodation', 'stay']):
            return 'hotel'
        elif any(word in filename_lower for word in ['meal', 'restaurant', 'food', 'dinner', 'lunch']):
            return 'meal'
        elif any(word in filename_lower for word in ['taxi', 'uber', 'cab']):
            return 'taxi'
        elif any(word in filename_lower for word in ['flight', 'airline']):
            return 'flight'
        else:
            return 'expense'