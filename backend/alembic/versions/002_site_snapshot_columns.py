"""Add snapshot columns to sites for change detection baselines.

Revision ID: 002
Revises: 001
Create Date: 2026-07-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("sites", sa.Column("snapshot_hashes", sa.JSON(), nullable=True))
    op.add_column("sites", sa.Column("snapshot_pages", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("sites", "snapshot_pages")
    op.drop_column("sites", "snapshot_hashes")
