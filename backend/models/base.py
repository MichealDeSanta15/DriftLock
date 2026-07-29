"""SQLAlchemy base configuration and database utilities for DriftLock."""

from datetime import datetime, timezone
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker
import uuid

Base = declarative_base()


def generate_uuid() -> str:
    """Generate a UUID for use as a primary key."""
    return str(uuid.uuid4())


def utc_now() -> datetime:
    """Get current UTC datetime."""
    return datetime.now(timezone.utc)
