"""Site model for tracking monitored websites in DriftLock."""

from datetime import datetime, timezone
from typing import List

from sqlalchemy import Column, String, DateTime, Boolean, Index
from sqlalchemy.orm import relationship

from backend.models.base import Base, generate_uuid


class Site(Base):
    """Represents a website being monitored by DriftLock.

    Stores metadata about each website and maintains relationships to all
    selectors, detection events, and repair outcomes associated with it.
    """

    __tablename__ = "sites"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    url = Column(String(2048), nullable=False)
    owner_id = Column(String(36), nullable=False, index=True)
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
    is_active = Column(Boolean, default=True, nullable=False)

    selectors = relationship(
        "Selector",
        back_populates="site",
        cascade="all, delete-orphan",
        lazy="select",
    )
    detection_events = relationship(
        "DetectionEvent",
        back_populates="site",
        cascade="all, delete-orphan",
        lazy="select",
    )

    __table_args__ = (Index("idx_owner_is_active", owner_id, is_active),)

    def __repr__(self) -> str:
        return f"<Site(id={self.id}, name={self.name}, url={self.url}, active={self.is_active})>"
