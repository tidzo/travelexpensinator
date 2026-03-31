from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    app_name: str = "Travel Expense Manager"
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./data/app.db")
    uploads_dir: str = "uploads"

    class Config:
        env_file = ".env"

settings = Settings()