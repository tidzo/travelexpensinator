from abc import ABC, abstractmethod
from typing import BinaryIO
from datetime import date

class StorageInterface(ABC):

    @abstractmethod
    def store_file(self, file: BinaryIO, original_filename: str, file_type: str, upload_date: date) -> tuple[str, str]:
        pass

    @abstractmethod
    def delete_file(self, file_path: str) -> bool:
        pass

    @abstractmethod
    def get_file_url(self, file_path: str) -> str:
        pass