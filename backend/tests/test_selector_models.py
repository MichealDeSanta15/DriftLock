"""Tests for selector models."""

from datetime import datetime, timezone

import pytest

from backend.models import Selector, SelectorVersion, ChangeLog


class TestSelector:
    """Tests for the Selector model."""

    def test_create_selector(self, test_db):
        """Test creating a basic selector."""
        selector = Selector(
            id="sel_example_1",
            site_id="site_example_com",
            selector_key="product_title",
            is_current=True,
            repair_count=0,
        )
        test_db.add(selector)
        test_db.commit()

        fetched = test_db.query(Selector).filter_by(id="sel_example_1").first()
        assert fetched is not None
        assert fetched.selector_key == "product_title"
        assert fetched.repair_count == 0

    def test_selector_timestamps(self, test_db):
        """Test that timestamps are automatically set."""
        selector = Selector(
            id="sel_timestamp_test",
            site_id="site_test",
            selector_key="test",
        )
        test_db.add(selector)
        test_db.commit()

        fetched = test_db.query(Selector).filter_by(id="sel_timestamp_test").first()
        assert fetched.created_at is not None
        assert fetched.updated_at is not None
        assert isinstance(fetched.created_at, datetime)

    def test_selector_by_site_and_current(self, test_db):
        """Test filtering selectors by (site_id, is_current) index."""
        selectors = [
            Selector(
                id="sel_site_1",
                site_id="site_example_com",
                selector_key="title",
                is_current=True,
            ),
            Selector(
                id="sel_site_2",
                site_id="site_example_com",
                selector_key="title",
                is_current=False,
            ),
        ]
        test_db.add_all(selectors)
        test_db.commit()

        current = (
            test_db.query(Selector)
            .filter_by(site_id="site_example_com", is_current=True)
            .all()
        )
        assert len(current) == 1
        assert current[0].id == "sel_site_1"


class TestSelectorVersion:
    """Tests for the SelectorVersion model."""

    def test_create_version(self, test_db):
        """Test creating a selector version."""
        selector = Selector(
            id="sel_version_test",
            site_id="site_test",
            selector_key="test",
        )
        test_db.add(selector)
        test_db.commit()

        version = SelectorVersion(
            selector_id="sel_version_test",
            selector_value="div.product-title",
            version_number=1,
            is_backup=False,
            confidence_score=95,
        )
        test_db.add(version)
        test_db.commit()

        fetched = (
            test_db.query(SelectorVersion).filter_by(selector_id="sel_version_test").first()
        )
        assert fetched.selector_value == "div.product-title"
        assert fetched.version_number == 1
        assert fetched.confidence_score == 95

    def test_version_backup_flag(self, test_db):
        """Test marking a version as backup."""
        selector = Selector(
            id="sel_backup_test",
            site_id="site_test",
            selector_key="test",
        )
        test_db.add(selector)
        test_db.commit()

        versions = [
            SelectorVersion(
                selector_id="sel_backup_test",
                selector_value="div.title",
                version_number=1,
                is_backup=False,
            ),
            SelectorVersion(
                selector_id="sel_backup_test",
                selector_value="h1[data-id]",
                version_number=2,
                is_backup=True,
            ),
        ]
        test_db.add_all(versions)
        test_db.commit()

        backup = (
            test_db.query(SelectorVersion)
            .filter_by(selector_id="sel_backup_test", is_backup=True)
            .first()
        )
        assert backup.selector_value == "h1[data-id]"

    def test_cascade_delete_versions(self, test_db):
        """Test that deleting selector cascades to versions."""
        selector = Selector(
            id="sel_cascade_test",
            site_id="site_test",
            selector_key="test",
        )
        test_db.add(selector)
        test_db.commit()

        version = SelectorVersion(
            selector_id="sel_cascade_test",
            selector_value="div.title",
            version_number=1,
        )
        test_db.add(version)
        test_db.commit()

        assert test_db.query(SelectorVersion).count() == 1

        test_db.delete(selector)
        test_db.commit()

        assert test_db.query(SelectorVersion).count() == 0


class TestChangeLog:
    """Tests for the ChangeLog model."""

    def test_create_change_log(self, test_db):
        """Test creating a change log entry."""
        selector = Selector(
            id="sel_log_test",
            site_id="site_test",
            selector_key="test",
        )
        test_db.add(selector)
        test_db.commit()

        log = ChangeLog(
            selector_id="sel_log_test",
            old_selector="div.old-title",
            new_selector="div.new-title",
            detection_method="dom_diff",
            repair_method="backup_key",
            repair_status="success",
            validation_score=98,
        )
        test_db.add(log)
        test_db.commit()

        fetched = test_db.query(ChangeLog).filter_by(selector_id="sel_log_test").first()
        assert fetched.old_selector == "div.old-title"
        assert fetched.new_selector == "div.new-title"
        assert fetched.repair_status == "success"

    def test_change_log_status_values(self, test_db):
        """Test different repair status values."""
        selector = Selector(
            id="sel_status_test",
            site_id="site_test",
            selector_key="test",
        )
        test_db.add(selector)
        test_db.commit()

        statuses = ["pending", "success", "failed", "partial"]
        logs = [
            ChangeLog(
                selector_id="sel_status_test",
                new_selector=f"div.status_{status}",
                repair_status=status,
            )
            for status in statuses
        ]
        test_db.add_all(logs)
        test_db.commit()

        for status in statuses:
            log = (
                test_db.query(ChangeLog)
                .filter_by(selector_id="sel_status_test", repair_status=status)
                .first()
            )
            assert log.repair_status == status

    def test_change_log_optional_fields(self, test_db):
        """Test change log with optional fields."""
        selector = Selector(
            id="sel_optional_test",
            site_id="site_test",
            selector_key="test",
        )
        test_db.add(selector)
        test_db.commit()

        log = ChangeLog(
            selector_id="sel_optional_test",
            new_selector="div.new",
            repair_status="pending",
        )
        test_db.add(log)
        test_db.commit()

        fetched = test_db.query(ChangeLog).filter_by(selector_id="sel_optional_test").first()
        assert fetched.old_selector is None
        assert fetched.version_id is None
        assert fetched.detection_method is None
