from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Ensure data directory exists for SQLite
os.makedirs("data", exist_ok=True)

SQLITE_DATABASE_URL = "sqlite:///./data/app.db"
POSTGRES_DATABASE_URL = os.getenv("DATABASE_URL", SQLITE_DATABASE_URL)

if POSTGRES_DATABASE_URL.startswith("sqlite"):
    from sqlalchemy import event

    engine = create_engine(
        POSTGRES_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

    # Enable foreign key constraints for all SQLite connections
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
else:
    engine = create_engine(POSTGRES_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()