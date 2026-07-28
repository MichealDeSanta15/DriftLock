"""Selector versioning and change tracking models for DriftLock.

Tracks selector definitions, versions, and repair history across website redesigns.
"""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    Boolean,
    create_engine,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker

Base = declarative_base()


class Selector(Base):
    """Selector definition linked to a specific site.

    Represents a CSS/XPath selector targeting data on a website. Multiple
    versions track the selector's evolution through site redesigns.
    """

    __tablename__ = "selectors"

    id = Column(String(64), primary_key=True)
    site_id = Column(String(64), nullable=False, index=True)
    selector_key = Column(String(255), nullable=False)
    is_current = Column(Boolean, default=True, nullable=False)
    repair_count = Column(Integer, default=0, nullable=False)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    versions = relationship(
        "SelectorVersion",
        back_populates="selector",
        cascade="all, delete-orphan",
        lazy="select",
    )
    change_logs = relationship(
        "ChangeLog",
        back_populates="selector",
        cascade="all, delete-orphan",
        lazy="select",
    )

    __table_args__ = (
        Index("idx_site_is_current", site_id, is_current),
        Index("idx_selector_key", selector_key),
    )

    def update_selector_state(
        self,
        new_selector: str,
        repair_method: str,
        confidence: int,
        session: Optional[object] = None,
    ) -> None:
        """Update selector state after successful repair.

        Updates the active selector key, increments repair count, and records
        the repair method and confidence. The updated_at timestamp is automatically
        updated by SQLAlchemy.

        Args:
            new_selector: The new CSS selector that works on the redesigned site.
            repair_method: How the selector was repaired (e.g., "backup_selector", "json_ld", "reverse_search").
            confidence: Confidence score 0-100 in the new selector.
            session: Optional SQLAlchemy session for explicit commit. If not provided, changes are staged.

        Example:
            selector.update_selector_state(
                new_selector="h2.product-name",
                repair_method="backup_selector",
                confidence=95
            )
            session.commit()
        """
        self.selector_key = new_selector
        self.repair_count += 1

        if session:
            session.add(self)

    def get_state(self) -> dict:
        """Get current selector state.

        Returns:
            Dictionary with current selector state and repair history.
        """
        last_repair = None
        if self.change_logs:
            successful_repairs = [
                log
                for log in self.change_logs
                if log.repair_status == "success" and log.repair_timestamp
            ]
            if successful_repairs:
                last_repair = max(successful_repairs, key=lambda x: x.repair_timestamp)

        return {
            "id": self.id,
            "site_id": self.site_id,
            "current_selector": self.selector_key,
            "is_current": self.is_current,
            "repair_count": self.repair_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_repair": {
                "timestamp": last_repair.repair_timestamp.isoformat() if last_repair else None,
                "method": last_repair.repair_method if last_repair else None,
                "confidence": last_repair.validation_score / 100 if last_repair and last_repair.validation_score else None,
            } if last_repair else None,
        }

    def __repr__(self) -> str:
        return f"<Selector(id={self.id}, site={self.site_id}, key={self.selector_key}, current={self.is_current})>"


class SelectorVersion(Base):
    """Version history for a selector.

    Tracks the evolution of selector definitions as sites redesign. Each row
    represents a snapshot of the selector at a point in time.
    """

    __tablename__ = "selector_versions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    selector_id = Column(String(64), ForeignKey("selectors.id"), nullable=False, index=True)
    selector_value = Column(Text, nullable=False)
    version_number = Column(Integer, nullable=False)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    is_backup = Column(Boolean, default=False, nullable=False)
    confidence_score = Column(Integer, default=100, nullable=False)

    selector = relationship("Selector", back_populates="versions")
    change_logs = relationship(
        "ChangeLog",
        back_populates="version",
        cascade="all, delete-orphan",
        lazy="select",
    )

    __table_args__ = (
        Index("idx_selector_version", selector_id, version_number),
        Index("idx_selector_created", selector_id, created_at),
    )

    def __repr__(self) -> str:
        return f"<SelectorVersion(selector={self.selector_id}, v{self.version_number}, backup={self.is_backup})>"


class ChangeLog(Base):
    """Detailed log of detection and repair events.

    Records when a selector change was detected, what the old/new values were,
    and the outcome of the repair attempt. Used for auditing and pattern learning.
    """

    __tablename__ = "change_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    selector_id = Column(String(64), ForeignKey("selectors.id"), nullable=False, index=True)
    version_id = Column(
        Integer, ForeignKey("selector_versions.id"), nullable=True, index=True
    )
    old_selector = Column(Text, nullable=True)
    new_selector = Column(Text, nullable=False)
    detection_method = Column(String(64), nullable=True)
    repair_method = Column(String(64), nullable=True)
    detection_timestamp = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    repair_timestamp = Column(DateTime(timezone=True), nullable=True)
    repair_status = Column(String(32), default="pending", nullable=False)
    validation_score = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)

    selector = relationship("Selector", back_populates="change_logs")
    version = relationship("SelectorVersion", back_populates="change_logs")

    __table_args__ = (
        Index("idx_selector_detection", selector_id, detection_timestamp),
        Index("idx_repair_status", repair_status),
    )

    def __repr__(self) -> str:
        return f"<ChangeLog(selector={self.selector_id}, status={self.repair_status}, detected={self.detection_timestamp})>"


def get_session_factory(database_url: str):
    """Create a session factory for the given database URL.

    Args:
        database_url: PostgreSQL connection string (e.g., postgresql://user:pass@localhost/driftlock)

    Returns:
        sessionmaker configured for the database.
    """
    engine = create_engine(database_url, echo=False)
    return sessionmaker(bind=engine, expire_on_commit=False)
