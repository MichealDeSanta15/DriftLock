"""Initialize and test DriftLock database models.

This script creates tables and demonstrates model relationships.
Run after setting DATABASE_URL in .env.
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.models.base import Base, generate_uuid, utc_now
from backend.models.site import Site
from backend.models.selector import Selector
from backend.models.detection_event import DetectionEvent
from backend.models.repair_outcome import RepairOutcome
from backend.models.api_key import ApiKey

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not set in .env file")

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)


def init_db() -> None:
    """Create all tables from model definitions."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created successfully")


def drop_db() -> None:
    """Drop all tables (use with caution)."""
    print("WARNING: Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("✓ Tables dropped")


def demo_models() -> None:
    """Demonstrate model creation and relationships."""
    session = SessionLocal()

    try:
        # Create a site
        site = Site(
            id=generate_uuid(),
            name="Example Site",
            url="https://example.com",
            owner_id=generate_uuid(),
            is_active=True,
        )
        session.add(site)
        session.flush()

        # Create a selector for the site
        selector = Selector(
            id=generate_uuid(),
            site_id=site.id,
            selector_key=".product-title",
            is_current=True,
            repair_count=0,
        )
        session.add(selector)
        session.flush()

        # Create a detection event
        detection = DetectionEvent(
            id=generate_uuid(),
            site_id=site.id,
            selector_id=selector.id,
            signal_type="hash_change",
            confidence=85,
        )
        session.add(detection)
        session.flush()

        # Create a repair outcome
        repair = RepairOutcome(
            id=generate_uuid(),
            selector_id=selector.id,
            old_selector=".product-title",
            new_selector=".product-name",
            repair_method="backup_selector",
            status="success",
            confidence=90,
        )
        session.add(repair)
        session.flush()

        # Create an API key
        api_key = ApiKey(
            id=generate_uuid(),
            owner_id=site.owner_id,
            key_hash="sha256_hash_of_key",
            is_revoked=False,
        )
        session.add(api_key)

        session.commit()
        print("✓ Demo models created successfully")
        print(f"  Site: {site}")
        print(f"  Selector: {selector}")
        print(f"  Detection: {detection}")
        print(f"  Repair: {repair}")
        print(f"  ApiKey: {api_key}")

    except Exception as e:
        session.rollback()
        print(f"✗ Error: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "init":
            init_db()
        elif command == "drop":
            drop_db()
        elif command == "demo":
            init_db()
            demo_models()
        else:
            print(f"Unknown command: {command}")
            print("Usage: python backend/init_models.py [init|drop|demo]")
    else:
        print("Usage: python backend/init_models.py [init|drop|demo]")
        print("  init  - Create tables")
        print("  drop  - Drop tables (dangerous!)")
        print("  demo  - Create tables and add demo data")
