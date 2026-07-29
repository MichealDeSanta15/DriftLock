"""Reset database by dropping all tables and re-running migrations.

WARNING: This script deletes all data. Use only in development/testing.
Do NOT use on production databases.
"""

import os
import sys
from pathlib import Path

from alembic.config import Config
from alembic.command import downgrade, upgrade
from sqlalchemy import text, create_engine
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set in environment")
    sys.exit(1)

# Confirm before destructive operation
if "production" in DATABASE_URL.lower() or "prod" in DATABASE_URL.lower():
    print("ERROR: Refusing to reset production database!")
    sys.exit(1)


def reset_db() -> None:
    """Drop all tables and rebuild database from migrations.

    WARNING: This is destructive and deletes all data.

    Raises:
        Exception: If reset fails.
    """
    print("=" * 60)
    print("WARNING: This will DELETE ALL DATA in the database!")
    print("=" * 60)

    response = input("Type 'yes' to confirm reset: ").strip().lower()
    if response != "yes":
        print("Reset cancelled.")
        sys.exit(0)

    # Get path to alembic.ini
    current_dir = Path(__file__).resolve().parent
    alembic_ini = current_dir / "alembic.ini"

    if not alembic_ini.exists():
        raise FileNotFoundError(f"alembic.ini not found at {alembic_ini}")

    print(f"\nResetting database at: {DATABASE_URL}")

    try:
        # Configure Alembic
        config = Config(str(alembic_ini))
        config.set_main_option("sqlalchemy.url", DATABASE_URL)

        # Step 1: Downgrade to base (drop all tables)
        print("Step 1: Dropping all tables...")
        downgrade(config, "base")
        print("✓ Tables dropped")

        # Step 2: Upgrade to head (create all tables)
        print("Step 2: Creating all tables from migrations...")
        upgrade(config, "head")
        print("✓ Tables created")

        print("\n✓ Database reset successfully")
        print("✓ All migrations applied")

    except Exception as e:
        print(f"✗ Reset failed: {e}")
        raise


def drop_all_tables() -> None:
    """Drop all tables without re-creating them.

    Useful for complete cleanup. Requires raw SQL access.

    Raises:
        Exception: If drop fails.
    """
    print("WARNING: Dropping all tables without migration rollback")

    response = input("Type 'yes' to confirm: ").strip().lower()
    if response != "yes":
        print("Cancelled.")
        sys.exit(0)

    engine = create_engine(DATABASE_URL)

    try:
        with engine.connect() as conn:
            # Drop in correct order (reverse of creation)
            tables = [
                "api_keys",
                "repair_outcomes",
                "detection_events",
                "selectors",
                "sites",
                "alembic_version",
            ]

            for table in tables:
                try:
                    conn.execute(text(f'DROP TABLE IF EXISTS "{table}" CASCADE'))
                    print(f"✓ Dropped table: {table}")
                except Exception as e:
                    print(f"⚠ Could not drop {table}: {e}")

            conn.commit()
            print("\n✓ All tables dropped")

    except Exception as e:
        print(f"✗ Drop failed: {e}")
        raise
    finally:
        engine.dispose()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Reset DriftLock database")
    parser.add_argument(
        "command",
        choices=["reset", "drop"],
        help="reset: drop and rebuild from migrations; drop: remove tables only",
    )

    args = parser.parse_args()

    if args.command == "reset":
        reset_db()
    elif args.command == "drop":
        drop_all_tables()
