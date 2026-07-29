"""Initial database schema for DriftLock.

Creates all core tables:
- sites: Monitored websites
- selectors: CSS/XPath selectors
- detection_events: Detected selector changes
- repair_outcomes: Repair attempt history
- api_keys: Customer authentication

Revision ID: 001
Revises:
Create Date: 2026-07-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create initial schema."""
    # Create sites table
    op.create_table(
        "sites",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("url", sa.String(2048), nullable=False),
        sa.Column("owner_id", sa.String(36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.PrimaryKeyConstraint("id"),
        sa.Index("idx_owner_is_active", "owner_id", "is_active"),
    )

    # Create selectors table
    op.create_table(
        "selectors",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("site_id", sa.String(36), nullable=False),
        sa.Column("selector_key", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_current", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("repair_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_repaired_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("old_selector", sa.Text(), nullable=True),
        sa.Column("new_selector", sa.Text(), nullable=True),
        sa.Column("repair_method", sa.String(64), nullable=True),
        sa.Column("repair_status", sa.String(32), nullable=False, server_default="pending"),
        sa.ForeignKeyConstraint(["site_id"], ["sites.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.Index("idx_site_is_current", "site_id", "is_current"),
        sa.Index("idx_selector_key", "selector_key"),
    )
    op.create_index("idx_site_id_selectors", "selectors", ["site_id"])

    # Create detection_events table
    op.create_table(
        "detection_events",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("site_id", sa.String(36), nullable=False),
        sa.Column("selector_id", sa.String(36), nullable=True),
        sa.Column("detected_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("signal_type", sa.String(64), nullable=False),
        sa.Column("confidence", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["site_id"], ["sites.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["selector_id"], ["selectors.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.Index("idx_site_detected_at", "site_id", "detected_at"),
    )
    op.create_index("idx_selector_id_detection_events", "detection_events", ["selector_id"])

    # Create repair_outcomes table
    op.create_table(
        "repair_outcomes",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("selector_id", sa.String(36), nullable=False),
        sa.Column("old_selector", sa.Text(), nullable=False),
        sa.Column("new_selector", sa.Text(), nullable=False),
        sa.Column("repair_method", sa.String(64), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("confidence", sa.Integer(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["selector_id"], ["selectors.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.Index("idx_selector_timestamp", "selector_id", "timestamp"),
        sa.Index("idx_repair_status", "status"),
    )

    # Create api_keys table
    op.create_table(
        "api_keys",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("owner_id", sa.String(36), nullable=False),
        sa.Column("key_hash", sa.String(64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_revoked", sa.Boolean(), nullable=False, server_default="false"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key_hash", name="uq_api_keys_key_hash"),
        sa.Index("idx_key_hash", "key_hash"),
    )
    op.create_index("idx_owner_id_api_keys", "api_keys", ["owner_id"])


def downgrade() -> None:
    """Drop all tables."""
    op.drop_table("api_keys")
    op.drop_table("repair_outcomes")
    op.drop_table("detection_events")
    op.drop_table("selectors")
    op.drop_table("sites")
