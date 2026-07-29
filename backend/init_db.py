"""Initialize database with Alembic migrations.

Runs all pending migrations to set up the production-ready schema.
Use this in deployment or development after pulling database changes.
"""

import os
import sys
from pathlib import Path

from alembic.config import Config
from alembic.command import upgrade
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set in environment")
    sys.exit(1)


def init_db() -> None:
    """Run all pending migrations to initialize the database.

    Raises:
        Exception: If migrations fail.
    """
    # Get path to alembic.ini
    current_dir = Path(__file__).resolve().parent
    alembic_ini = current_dir / "alembic.ini"

    if not alembic_ini.exists():
        raise FileNotFoundError(f"alembic.ini not found at {alembic_ini}")

    # Configure Alembic
    config = Config(str(alembic_ini))
    config.set_main_option("sqlalchemy.url", DATABASE_URL)

    print(f"Initializing database at: {DATABASE_URL}")
    print("Running migrations...")

    try:
        upgrade(config, "head")
        print("✓ Database initialized successfully")
        print("✓ All migrations applied")
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        raise


if __name__ == "__main__":
    init_db()
