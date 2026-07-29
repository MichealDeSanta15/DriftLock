"""Selector model for tracking CSS/XPath selectors in DriftLock."""

from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Integer, Boolean, ForeignKey, Index, Text
from sqlalchemy.orm import relationship

from .base import Base, generate_uuid


class Selector(Base):
    """Represents a CSS/XPath selector targeting data on a website.

    Multiple versions track the selector's evolution through site redesigns.
    Stores current and historical selector values with repair metadata.
    """

    __tablename__ = "selectors"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    site_id = Column(String(36), ForeignKey("sites.id"), nullable=False, index=True)
    selector_key = Column(String(255), nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    is_current = Column(Boolean, default=True, nullable=False)
    repair_count = Column(Integer, default=0, nullable=False)
    last_repaired_at = Column(DateTime(timezone=True), nullable=True)

    old_selector = Column(Text, nullable=True)
    new_selector = Column(Text, nullable=True)
    repair_method = Column(String(64), nullable=True)
    repair_status = Column(String(32), default="pending", nullable=False)

    site = relationship("Site", back_populates="selectors")
    detection_events = relationship(
        "DetectionEvent",
        back_populates="selector",
        cascade="all, delete-orphan",
        lazy="select",
    )
    repair_outcomes = relationship(
        "RepairOutcome",
        back_populates="selector",
        cascade="all, delete-orphan",
        lazy="select",
    )

    __table_args__ = (
        Index("idx_site_is_current", site_id, is_current),
        Index("idx_selector_key", selector_key),
    )

    def __repr__(self) -> str:
        return f"<Selector(id={self.id}, site={self.site_id}, key={self.selector_key}, current={self.is_current})>"
