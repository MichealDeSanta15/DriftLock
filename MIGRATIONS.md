# DriftLock Database Migrations with Alembic

Complete guide to Alembic database migrations for DriftLock.

## Overview

DriftLock uses Alembic for database schema versioning and migration management. This enables:
- **Reproducible deployments** across dev, staging, and production
- **Rollback capability** if a migration causes issues  
- **Migration history** for audit and debugging
- **Team collaboration** with safe schema changes

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

Includes: `alembic==1.13.1`

### 2. Configure Database Connection

Edit `.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/driftlock_dev
```

Alembic reads `DATABASE_URL` from `.env` via the `env.py` configuration.

### 3. Initialize Database (First Time Only)

```bash
python backend/init_db.py
```

This:
1. Creates a fresh PostgreSQL database
2. Runs all migrations in order
3. Creates `alembic_version` table to track migration state
4. Creates 5 data tables: sites, selectors, detection_events, repair_outcomes, api_keys

## Common Commands

### Check Migration Status

```bash
# Show current migration version
cd backend && alembic current

# Show all migrations and their status
cd backend && alembic history --verbose
```

### Apply Migrations (Development)

```bash
# Upgrade to latest migration (head)
cd backend && alembic upgrade head

# Upgrade to a specific migration
cd backend && alembic upgrade 001
```

### Rollback Migrations

```bash
# Downgrade one migration
cd backend && alembic downgrade -1

# Downgrade to a specific migration
cd backend && alembic downgrade 001

# Drop all tables (downgrade to base)
cd backend && alembic downgrade base
```

### Reset Database (Testing/Development Only)

```bash
# Interactive reset with confirmation
python backend/reset_db.py
```

This safely:
1. Downgraded all tables and indexes
2. Re-applies all migrations
3. Verifies the schema is clean

⚠️ **Warning**: This deletes all data. Use only in development/testing.

### Create New Migrations

When you modify models, create a migration:

```bash
cd backend && alembic revision --autogenerate -m "describe_your_change"
```

This:
1. Detects changes to `backend.models` by comparing to database
2. Generates `versions/002_describe_your_change.py`
3. Creates `upgrade()` and `downgrade()` functions
4. Requires manual review before applying

Then apply:
```bash
cd backend && alembic upgrade head
```

## File Structure

```
backend/
├── alembic/
│   ├── env.py                    # Alembic runtime configuration
│   ├── script.py.mako            # Migration file template
│   └── versions/
│       ├── __init__.py
│       └── 001_initial_schema.py # Initial migration
├── alembic.ini                   # Alembic configuration
├── init_db.py                    # Initialize database
├── reset_db.py                   # Reset database (dev only)
└── schema.sql                    # Reference SQL schema
```

## Migration 001: Initial Schema

**Location**: `backend/alembic/versions/001_initial_schema.py`

Creates the foundation schema:

### Tables Created

1. **sites** — Customer websites
   - Primary key: UUID
   - Foreign keys: None
   - Indexes: (owner_id, is_active), owner_id

2. **selectors** — Selectors with repair history
   - Primary key: UUID
   - Foreign keys: site_id → sites
   - Indexes: (site_id, is_current), selector_key

3. **detection_events** — Change detection logs
   - Primary key: UUID
   - Foreign keys: site_id → sites, selector_id → selectors
   - Indexes: (site_id, detected_at), selector_id

4. **repair_outcomes** — Repair audit trail
   - Primary key: UUID
   - Foreign keys: selector_id → selectors
   - Indexes: (selector_id, timestamp), status

5. **api_keys** — API authentication keys
   - Primary key: UUID
   - Foreign keys: None
   - Indexes: key_hash, owner_id

### Upgrade Logic

```python
def upgrade() -> None:
    """Create all tables and indexes."""
    op.create_table('sites', ...)
    op.create_index('idx_site_owner_active', ...)
    # ... repeat for other tables
```

### Downgrade Logic

```python
def downgrade() -> None:
    """Drop all tables and indexes."""
    op.drop_index('idx_site_owner_active', ...)
    op.drop_table('sites')
    # ... repeat for other tables in reverse order
```

## Adding New Migrations

### Example: Add `metadata` JSON column to sites

1. **Modify the model** in `backend/models/site.py`:

```python
metadata = Column(JSON, nullable=True, default={})
```

2. **Generate migration**:

```bash
cd backend && alembic revision --autogenerate -m "add_metadata_to_sites"
```

This creates `backend/alembic/versions/002_add_metadata_to_sites.py`:

```python
def upgrade() -> None:
    op.add_column('sites', sa.Column('metadata', postgresql.JSON(), server_default='{}'))

def downgrade() -> None:
    op.drop_column('sites', 'metadata')
```

3. **Apply migration**:

```bash
cd backend && alembic upgrade head
```

4. **Test rollback**:

```bash
cd backend && alembic downgrade -1
```

## Best Practices

### ✅ DO

- Create migrations for every schema change
- Review generated migrations before applying
- Test rollbacks in development
- Include `ondelete='CASCADE'` for cleanup
- Use descriptive migration names: `add_index_on_owner_id`, `increase_url_length`
- Test migrations in dev before deploying to production

### ❌ DON'T

- Modify migrations after they're applied to production
- Skip migrations and run raw SQL directly
- Create migrations that assume existing data (e.g., SET DEFAULT on new non-nullable column)
- Use `alembic upgrade head` in production without testing first
- Downgrade production databases unless absolutely necessary

## Troubleshooting

### "Migrations can't find DATABASE_URL"

**Issue**: Alembic can't connect to database

**Solution**: Ensure `.env` exists with valid `DATABASE_URL`:
```bash
cp .env.example .env
# Edit DATABASE_URL
cat .env
```

### "Target database is not up to date"

**Issue**: Migration history doesn't match current schema

**Solution**: Check status and align:
```bash
cd backend && alembic current
cd backend && alembic history
cd backend && alembic upgrade head
```

### "Can't auto-detect changes"

**Issue**: `alembic revision --autogenerate` generates empty migration

**Solution**: Ensure:
1. `env.py` imports your models: `from backend.models import Base`
2. `target_metadata = Base.metadata` is set in `env.py`
3. Models are imported before Alembic compares schemas

### "Can't drop foreign keys"

**Issue**: Downgrade fails because of constraint violations

**Solution**: Alembic's `op.drop_column()` requires `batch_mode=True` for PostgreSQL:

```python
with op.batch_alter_table('selectors') as batch_op:
    batch_op.drop_column('site_id')
```

## Testing Migrations

Run the migration test suite:

```bash
pytest backend/tests/test_migrations.py -v
```

Tests verify:
- ✅ Migration upgrade runs without error
- ✅ All 5 tables are created
- ✅ All columns have correct types
- ✅ All indexes are created
- ✅ All foreign keys are in place
- ✅ Migration downgrade works correctly

## Production Deployment

### Pre-Deployment Checklist

- [ ] All migrations tested in local dev environment
- [ ] Database backup taken (if modifying existing data)
- [ ] Downtime window communicated if needed
- [ ] Rollback plan documented
- [ ] Dry-run migration on staging environment

### Deployment Steps

```bash
# 1. On deployment server
cd /app
git pull origin main

# 2. Check which migrations will run
cd backend && alembic current
cd backend && alembic history

# 3. Apply migrations
cd backend && alembic upgrade head

# 4. Verify schema
psql $DATABASE_URL -c "\d+ sites"

# 5. Run smoke tests
pytest backend/tests/test_migrations.py
```

### Rollback (If Needed)

```bash
cd backend
alembic downgrade 001
# Or downgrade one version:
alembic downgrade -1
```

## Reference Files

- **schema.sql** — Reference schema (PostgreSQL syntax)
- **DATABASE.md** — Model documentation
- **MIGRATIONS.md** — This file

## Next Steps

Person 1 can now:
- Create API endpoints that query the migrated schema
- Add new models and generate migrations with `alembic revision --autogenerate`
- Deploy with `alembic upgrade head` in production

Person 2 can assume the database schema is stable and accessible via Person 1's API.
