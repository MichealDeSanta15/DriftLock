"""Detection event model for logging selector change detection signals."""

from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Index
from sqlalchemy.orm import relationship

from backend.models.base import Base, generate_uuid


class DetectionEvent(Base):
    """Logs when a selector change is detected on a website.

    Stores detection signals (hash changes, DOM differences, template shifts)
    with confidence scores. Used to trigger repair attempts and track
    detection accuracy over time.
    """

    __tablename__ = "detection_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    site_id = Column(String(36), ForeignKey("sites.id"), nullable=False, index=True)
    selector_id = Column(
        String(36), ForeignKey("selectors.id"), nullable=True, index=True
    )
    detected_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    signal_type = Column(
        String(64), nullable=False
    )
    confidence = Column(Integer, default=0, nullable=False)
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

    site = relationship("Site", back_populates="detection_events")
    selector = relationship("Selector", back_populates="detection_events")

    __table_args__ = (Index("idx_site_detected_at", site_id, detected_at),)

    def __repr__(self) -> str:
        return f"<DetectionEvent(id={self.id}, site={self.site_id}, signal={self.signal_type}, confidence={self.confidence})>"
