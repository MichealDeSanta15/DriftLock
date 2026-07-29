"""Database connection and session management for DriftLock."""

import os
from typing import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

load_dotenv()

DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://localhost/driftlock")

engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency for obtaining a database session.

    Yields:
        SQLAlchemy Session for database operations.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database tables from ORM models.

    Run this once at startup or use Alembic migrations in production.
    """
    from backend.models.base import Base

    Base.metadata.create_all(bind=engine)
