from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    app_name: str = "Travel Expense Manager"
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./data/app.db")
    uploads_dir: str = "uploads"
    cors_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:5173")
    default_incidental_amount: float = float(os.getenv("DEFAULT_INCIDENTAL_AMOUNT", "5.0"))

    @property
    def cors_origins_list(self) -> list[str]:
        """Convert comma-separated CORS origins string to list"""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"

settings = Settings()