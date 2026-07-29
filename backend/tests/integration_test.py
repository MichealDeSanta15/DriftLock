"""Integration tests for DriftLock backend.

Tests database connectivity, models, relationships, and real-world scenarios.
Run with: pytest backend/tests/integration_test.py -v
"""

import pytest
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from backend.models.base import generate_uuid
from backend.models.site import Site
from backend.models.selector import Selector
from backend.models.detection_event import DetectionEvent
from backend.models.repair_outcome import RepairOutcome
from backend.models.api_key import APIKey


class TestDatabaseConnection:
    """Test database connectivity and schema setup."""

    def test_database_reachable(self, test_engine):
        """Verify PostgreSQL database is reachable."""
        with test_engine.connect() as connection:
            # Simple query to verify connection works
            result = connection.execute(text("SELECT 1"))
            assert result.scalar() == 1

    def test_migrations_ran(self, test_engine):
        """Verify all database migrations have been applied."""
        inspector = inspect(test_engine)
        tables = inspector.get_table_names()

        # Verify all expected tables exist
        expected_tables = {
            "sites",
            "selectors",
            "detection_events",
            "repair_outcomes",
            "api_keys",
        }

        for table in expected_tables:
            assert table in tables, f"Table '{table}' not found in database"

    def test_all_tables_have_columns(self, test_engine):
        """Verify tables have the expected columns."""
        inspector = inspect(test_engine)

        # Expected columns per table
        expected_columns = {
            "sites": {"id", "name", "url", "owner_id", "created_at", "updated_at", "is_active"},
            "selectors": {
                "id", "site_id", "selector_key", "is_current", "repair_count",
                "last_repaired_at", "old_selector", "new_selector",
                "repair_method", "repair_status", "created_at", "updated_at"
            },
            "detection_events": {
                "id", "site_id", "selector_id", "detected_at", "signal_type",
                "confidence", "created_at", "updated_at"
            },
            "repair_outcomes": {
                "id", "selector_id", "old_selector", "new_selector",
                "repair_method", "status", "timestamp", "created_at",
                "updated_at", "confidence", "error_message"
            },
            "api_keys": {
                "id", "owner_id", "key_hash", "created_at", "updated_at",
                "last_used_at", "is_revoked"
            },
        }

        for table, expected_cols in expected_columns.items():
            columns = {col["name"] for col in inspector.get_columns(table)}
            for col in expected_cols:
                assert col in columns, f"Column '{col}' not found in table '{table}'"

    def test_indexes_exist(self, test_engine):
        """Verify all performance indexes are created."""
        inspector = inspect(test_engine)

        # Expected indexes
        expected_indexes = {
            "sites": ["idx_owner_is_active"],
            "selectors": ["idx_site_is_current", "idx_selector_key"],
            "detection_events": ["idx_site_detected_at"],
            "repair_outcomes": ["idx_selector_timestamp", "idx_repair_status"],
            "api_keys": ["idx_key_hash"],
        }

        for table, indexes in expected_indexes.items():
            existing_indexes = {idx["name"] for idx in inspector.get_indexes(table)}
            for idx in indexes:
                assert idx in existing_indexes, f"Index '{idx}' not found on table '{table}'"


class TestModelOperations:
    """Test basic model operations and relationships."""

    def test_create_site(self, db: Session):
        """Test creating a Site."""
        owner_id = generate_uuid()
        site = Site(
            id=generate_uuid(),
            name="Test Website",
            url="https://example.com",
            owner_id=owner_id,
            is_active=True,
        )

        db.add(site)
        db.commit()

        # Verify site was saved
        retrieved = db.query(Site).filter_by(id=site.id).first()
        assert retrieved is not None
        assert retrieved.name == "Test Website"
        assert retrieved.url == "https://example.com"
        assert retrieved.owner_id == owner_id
        assert retrieved.is_active is True
        assert retrieved.created_at is not None
        assert retrieved.updated_at is not None

    def test_create_selector(self, db: Session):
        """Test creating a Selector for a Site."""
        # Create site first
        site = Site(
            id=generate_uuid(),
            name="Test Site",
            url="https://example.com",
            owner_id=generate_uuid(),
            is_active=True,
        )
        db.add(site)
        db.commit()

        # Create selector
        selector = Selector(
            id=generate_uuid(),
            site_id=site.id,
            selector_key=".product-title",
            is_current=True,
            repair_count=0,
        )

        db.add(selector)
        db.commit()

        # Verify selector was saved
        retrieved = db.query(Selector).filter_by(id=selector.id).first()
        assert retrieved is not None
        assert retrieved.site_id == site.id
        assert retrieved.selector_key == ".product-title"
        assert retrieved.is_current is True
        assert retrieved.repair_count == 0

    def test_site_selector_relationship(self, db: Session):
        """Test Site -> Selector relationship."""
        # Create site with selector
        site = Site(
            id=generate_uuid(),
            name="Test Site",
            url="https://example.com",
            owner_id=generate_uuid(),
            is_active=True,
        )
        db.add(site)
        db.commit()

        selector1 = Selector(
            id=generate_uuid(),
            site_id=site.id,
            selector_key=".title",
            is_current=True,
        )
        selector2 = Selector(
            id=generate_uuid(),
            site_id=site.id,
            selector_key=".price",
            is_current=True,
        )

        db.add_all([selector1, selector2])
        db.commit()

        # Verify relationship
        retrieved_site = db.query(Site).filter_by(id=site.id).first()
        assert len(retrieved_site.selectors) == 2

        selector_keys = {s.selector_key for s in retrieved_site.selectors}
        assert ".title" in selector_keys
        assert ".price" in selector_keys

    def test_create_detection_event(self, db: Session):
        """Test creating a DetectionEvent."""
        # Create site and selector
        site = Site(
            id=generate_uuid(),
            name="Test Site",
            url="https://example.com",
            owner_id=generate_uuid(),
            is_active=True,
        )
        db.add(site)
        db.commit()

        selector = Selector(
            id=generate_uuid(),
            site_id=site.id,
            selector_key=".title",
            is_current=True,
        )
        db.add(selector)
        db.commit()

        # Create detection event
        detection = DetectionEvent(
            id=generate_uuid(),
            site_id=site.id,
            selector_id=selector.id,
            signal_type="hash_change",
            confidence=85,
        )

        db.add(detection)
        db.commit()

        # Verify detection was saved
        retrieved = db.query(DetectionEvent).filter_by(id=detection.id).first()
        assert retrieved is not None
        assert retrieved.site_id == site.id
        assert retrieved.selector_id == selector.id
        assert retrieved.signal_type == "hash_change"
        assert retrieved.confidence == 85

    def test_create_repair_outcome(self, db: Session):
        """Test creating a RepairOutcome."""
        # Create site and selector
        site = Site(
            id=generate_uuid(),
            name="Test Site",
            url="https://example.com",
            owner_id=generate_uuid(),
            is_active=True,
        )
        db.add(site)
        db.commit()

        selector = Selector(
            id=generate_uuid(),
            site_id=site.id,
            selector_key=".title",
            is_current=True,
        )
        db.add(selector)
        db.commit()

        # Create repair outcome
        repair = RepairOutcome(
            id=generate_uuid(),
            selector_id=selector.id,
            old_selector=".title",
            new_selector=".product-title",
            repair_method="backup_selector",
            status="success",
            confidence=92,
        )

        db.add(repair)
        db.commit()

        # Verify repair was saved
        retrieved = db.query(RepairOutcome).filter_by(id=repair.id).first()
        assert retrieved is not None
        assert retrieved.selector_id == selector.id
        assert retrieved.old_selector == ".title"
        assert retrieved.new_selector == ".product-title"
        assert retrieved.repair_method == "backup_selector"
        assert retrieved.status == "success"
        assert retrieved.confidence == 92

    def test_create_api_key(self, db: Session):
        """Test creating an APIKey."""
        owner_id = generate_uuid()
        api_key = APIKey(
            id=generate_uuid(),
            owner_id=owner_id,
            key_hash="sha256_hash_1234567890",
            is_revoked=False,
        )

        db.add(api_key)
        db.commit()

        # Verify api key was saved
        retrieved = db.query(APIKey).filter_by(id=api_key.id).first()
        assert retrieved is not None
        assert retrieved.owner_id == owner_id
        assert retrieved.key_hash == "sha256_hash_1234567890"
        assert retrieved.is_revoked is False
        assert retrieved.last_used_at is None


class TestRealWorldScenario:
    """Test realistic end-to-end scenarios."""

    def test_full_workflow_site_to_repair(self, db: Session):
        """Test complete workflow: Site > Selector > Detection > Repair.

        Scenario:
        1. Customer adds a website (Site)
        2. Site has CSS selectors to monitor (Selectors)
        3. Detection signal finds a change (DetectionEvent)
        4. System repairs the selector (RepairOutcome)
        5. Verify all data is correctly linked
        """
        # Step 1: Create a monitored website
        customer_id = generate_uuid()
        site = Site(
            id=generate_uuid(),
            name="Acme Corp E-commerce",
            url="https://acme-shop.com",
            owner_id=customer_id,
            is_active=True,
        )
        db.add(site)
        db.commit()

        assert site.id is not None
        assert site.name == "Acme Corp E-commerce"

        # Step 2: Add selectors to monitor
        selectors = [
            Selector(
                id=generate_uuid(),
                site_id=site.id,
                selector_key=".product-price",
                is_current=True,
            ),
            Selector(
                id=generate_uuid(),
                site_id=site.id,
                selector_key=".product-title",
                is_current=True,
            ),
        ]
        db.add_all(selectors)
        db.commit()

        # Verify selectors are linked to site
        retrieved_site = db.query(Site).filter_by(id=site.id).first()
        assert len(retrieved_site.selectors) == 2

        # Step 3: Detect a selector change (hash_change signal)
        price_selector = selectors[0]
        detection = DetectionEvent(
            id=generate_uuid(),
            site_id=site.id,
            selector_id=price_selector.id,
            signal_type="hash_change",
            confidence=92,
        )
        db.add(detection)
        db.commit()

        # Verify detection is logged
        retrieved_detection = db.query(DetectionEvent).filter_by(
            id=detection.id
        ).first()
        assert retrieved_detection is not None
        assert retrieved_detection.signal_type == "hash_change"

        # Step 4: Repair the selector
        repair = RepairOutcome(
            id=generate_uuid(),
            selector_id=price_selector.id,
            old_selector=".product-price",
            new_selector=".price-tag",
            repair_method="backup_selector",
            status="success",
            confidence=95,
        )
        db.add(repair)
        db.commit()

        # Update selector with new value
        price_selector.new_selector = ".price-tag"
        price_selector.repair_method = "backup_selector"
        price_selector.repair_status = "success"
        price_selector.repair_count += 1
        price_selector.last_repaired_at = datetime.now(timezone.utc)
        db.commit()

        # Step 5: Verify complete workflow
        # Retrieve site and check all relationships
        final_site = db.query(Site).filter_by(id=site.id).first()
        assert final_site.name == "Acme Corp E-commerce"
        assert len(final_site.selectors) == 2

        # Check selector was updated
        updated_selector = db.query(Selector).filter_by(
            id=price_selector.id
        ).first()
        assert updated_selector.new_selector == ".price-tag"
        assert updated_selector.repair_count == 1
        assert updated_selector.last_repaired_at is not None

        # Check detection is logged
        detections = db.query(DetectionEvent).filter_by(
            site_id=site.id
        ).all()
        assert len(detections) == 1
        assert detections[0].signal_type == "hash_change"

        # Check repair outcome is recorded
        repairs = db.query(RepairOutcome).filter_by(
            selector_id=price_selector.id
        ).all()
        assert len(repairs) == 1
        assert repairs[0].status == "success"
        assert repairs[0].confidence == 95

    def test_multiple_sites_multiple_selectors(self, db: Session):
        """Test managing multiple sites with multiple selectors each."""
        customer_id = generate_uuid()

        # Create 2 sites
        sites = [
            Site(
                id=generate_uuid(),
                name="Site A",
                url="https://site-a.com",
                owner_id=customer_id,
                is_active=True,
            ),
            Site(
                id=generate_uuid(),
                name="Site B",
                url="https://site-b.com",
                owner_id=customer_id,
                is_active=True,
            ),
        ]
        db.add_all(sites)
        db.commit()

        # Create 3 selectors per site
        for site in sites:
            selectors = [
                Selector(
                    id=generate_uuid(),
                    site_id=site.id,
                    selector_key=f".selector-{i}",
                    is_current=True,
                )
                for i in range(3)
            ]
            db.add_all(selectors)
        db.commit()

        # Verify structure
        all_sites = db.query(Site).filter_by(owner_id=customer_id).all()
        assert len(all_sites) == 2

        total_selectors = 0
        for site in all_sites:
            assert len(site.selectors) == 3
            total_selectors += len(site.selectors)

        assert total_selectors == 6

    def test_detection_to_repair_flow(self, db: Session):
        """Test detection signal triggers repair flow."""
        # Setup: Site with selector
        site = Site(
            id=generate_uuid(),
            name="Test Site",
            url="https://example.com",
            owner_id=generate_uuid(),
            is_active=True,
        )
        db.add(site)
        db.commit()

        selector = Selector(
            id=generate_uuid(),
            site_id=site.id,
            selector_key=".old-selector",
            is_current=True,
        )
        db.add(selector)
        db.commit()

        # Step 1: Multiple detection signals
        detection_signals = [
            ("hash_change", 88),
            ("dom_diff", 79),
            ("template_shift", 92),
        ]

        for signal_type, confidence in detection_signals:
            detection = DetectionEvent(
                id=generate_uuid(),
                site_id=site.id,
                selector_id=selector.id,
                signal_type=signal_type,
                confidence=confidence,
            )
            db.add(detection)
        db.commit()

        # Step 2: Repair attempts (multiple tries)
        repair_attempts = [
            ("backup_selector", "success", 95),
            ("json_ld", "success", 88),
        ]

        for method, status, confidence in repair_attempts:
            new_selector = f".new-selector-{method}"
            repair = RepairOutcome(
                id=generate_uuid(),
                selector_id=selector.id,
                old_selector=".old-selector",
                new_selector=new_selector,
                repair_method=method,
                status=status,
                confidence=confidence,
            )
            db.add(repair)
        db.commit()

        # Step 3: Verify all signals and repairs are recorded
        detections = db.query(DetectionEvent).filter_by(
            selector_id=selector.id
        ).all()
        assert len(detections) == 3

        repairs = db.query(RepairOutcome).filter_by(
            selector_id=selector.id
        ).all()
        assert len(repairs) == 2

        # Verify last repair
        last_repair = repairs[-1]
        assert last_repair.repair_method == "json_ld"
        assert last_repair.status == "success"


class TestDataIntegrity:
    """Test data integrity and constraints."""

    def test_cascade_delete_selectors(self, db: Session):
        """Test cascade delete: removing Site removes its Selectors."""
        site = Site(
            id=generate_uuid(),
            name="Test Site",
            url="https://example.com",
            owner_id=generate_uuid(),
            is_active=True,
        )
        db.add(site)
        db.commit()

        selectors = [
            Selector(
                id=generate_uuid(),
                site_id=site.id,
                selector_key=f".selector-{i}",
                is_current=True,
            )
            for i in range(3)
        ]
        db.add_all(selectors)
        db.commit()

        # Verify selectors exist
        count_before = db.query(Selector).filter_by(site_id=site.id).count()
        assert count_before == 3

        # Delete site
        db.delete(site)
        db.commit()

        # Verify selectors are also deleted (cascade)
        count_after = db.query(Selector).filter_by(site_id=site.id).count()
        assert count_after == 0

    def test_cascade_delete_detection_events(self, db: Session):
        """Test cascade delete: removing Selector removes its DetectionEvents."""
        site = Site(
            id=generate_uuid(),
            name="Test Site",
            url="https://example.com",
            owner_id=generate_uuid(),
            is_active=True,
        )
        db.add(site)
        db.commit()

        selector = Selector(
            id=generate_uuid(),
            site_id=site.id,
            selector_key=".selector",
            is_current=True,
        )
        db.add(selector)
        db.commit()

        detections = [
            DetectionEvent(
                id=generate_uuid(),
                site_id=site.id,
                selector_id=selector.id,
                signal_type="hash_change",
                confidence=90,
            )
            for _ in range(2)
        ]
        db.add_all(detections)
        db.commit()

        # Verify detections exist
        count_before = db.query(DetectionEvent).filter_by(
            selector_id=selector.id
        ).count()
        assert count_before == 2

        # Delete selector
        db.delete(selector)
        db.commit()

        # Verify detections are also deleted (cascade)
        count_after = db.query(DetectionEvent).filter_by(
            selector_id=selector.id
        ).count()
        assert count_after == 0

    def test_cascade_delete_repair_outcomes(self, db: Session):
        """Test cascade delete: removing Selector removes its RepairOutcomes."""
        site = Site(
            id=generate_uuid(),
            name="Test Site",
            url="https://example.com",
            owner_id=generate_uuid(),
            is_active=True,
        )
        db.add(site)
        db.commit()

        selector = Selector(
            id=generate_uuid(),
            site_id=site.id,
            selector_key=".selector",
            is_current=True,
        )
        db.add(selector)
        db.commit()

        repairs = [
            RepairOutcome(
                id=generate_uuid(),
                selector_id=selector.id,
                old_selector=".old",
                new_selector=".new",
                repair_method="backup",
                status="success",
            )
            for _ in range(2)
        ]
        db.add_all(repairs)
        db.commit()

        # Verify repairs exist
        count_before = db.query(RepairOutcome).filter_by(
            selector_id=selector.id
        ).count()
        assert count_before == 2

        # Delete selector
        db.delete(selector)
        db.commit()

        # Verify repairs are also deleted (cascade)
        count_after = db.query(RepairOutcome).filter_by(
            selector_id=selector.id
        ).count()
        assert count_after == 0


# Add missing imports
from sqlalchemy import inspect, text
