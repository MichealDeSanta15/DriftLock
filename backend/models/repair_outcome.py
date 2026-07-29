"""Repair outcome model for tracking selector repair history."""

from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Index, Text
from sqlalchemy.orm import relationship

from backend.models.base import Base, generate_uuid


class RepairOutcome(Base):
    """Records the result of each selector repair attempt.

    Tracks what selectors were tried, which repair method was used,
    whether it succeeded, and confidence scores. Forms the audit trail
    for repair operations and feeds into pattern learning.
    """

    __tablename__ = "repair_outcomes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    selector_id = Column(String(36), ForeignKey("selectors.id"), nullable=False, index=True)
    old_selector = Column(Text, nullable=False)
    new_selector = Column(Text, nullable=False)
    repair_method = Column(String(64), nullable=False)
    status = Column(String(32), nullable=False)
    timestamp = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
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
    confidence = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)

    selector = relationship("Selector", back_populates="repair_outcomes")

    __table_args__ = (
        Index("idx_selector_timestamp", selector_id, timestamp),
        Index("idx_repair_status", status),
    )

    def __repr__(self) -> str:
        return f"<RepairOutcome(id={self.id}, selector={self.selector_id}, status={self.status}, method={self.repair_method})>"
