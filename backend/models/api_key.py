"""API key model for customer authentication in DriftLock."""

from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Boolean, Index

from backend.models.base import Base, generate_uuid


class APIKey(Base):
    """Stores hashed API keys for customer authentication.

    Keys are stored as hashes to prevent compromise if the database is breached.
    Tracks creation time, last usage, and revocation status for key lifecycle management.
    """

    __tablename__ = "api_keys"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    owner_id = Column(String(36), nullable=False, index=True)
    key_hash = Column(String(64), nullable=False, unique=True)
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
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    is_revoked = Column(Boolean, default=False, nullable=False)

    __table_args__ = (Index("idx_key_hash", key_hash),)

    def __repr__(self) -> str:
        return f"<ApiKey(id={self.id}, owner={self.owner_id}, revoked={self.is_revoked})>"
