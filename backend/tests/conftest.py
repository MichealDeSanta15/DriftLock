"""Pytest configuration and fixtures for backend tests.

Provides database sessions for unit and integration testing.
Uses PostgreSQL for integration tests, falls back to SQLite for unit tests.
"""

import os
from typing import Generator

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from backend.models.base import Base

# Get test database URL from environment or use default
# For integration tests: use PostgreSQL
# For unit tests: can use in-memory SQLite
TEST_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    os.getenv("TEST_DATABASE_URL", "sqlite:///:memory:")
)


@pytest.fixture(scope="session")
def test_engine():
    """Create test database engine (session-scoped).

    Creates all tables from models at session start,
    drops all tables at session end.

    Yields:
        SQLAlchemy Engine configured for testing.
    """
    # For SQLite, add connection arguments
    engine_kwargs = {}
    if "sqlite" in TEST_DATABASE_URL:
        engine_kwargs["connect_args"] = {"check_same_thread": False}

    engine = create_engine(TEST_DATABASE_URL, echo=False, **engine_kwargs)

    # Create all tables
    Base.metadata.create_all(bind=engine)

    yield engine

    # Cleanup after all tests
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db(test_engine) -> Generator[Session, None, None]:
    """Provide clean database session for each test (function-scoped).

    Wraps each test in a transaction that's rolled back,
    ensuring tests don't interfere with each other.

    Yields:
        SQLAlchemy Session for database operations.
    """
    connection = test_engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)()

    yield session

    # Cleanup after test
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def db_clean(test_engine):
    """Provide completely clean database for each test (function-scoped).

    Useful for tests that need a fresh database without any data.
    Drops and recreates all tables.

    Yields:
        None (use db fixture instead for actual session).
    """
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    yield

    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
