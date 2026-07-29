# Story 1, Phase 2: Alembic Migrations — COMPLETED

## Overview

Person 3 (DevOps/Integration) has set up Alembic for database schema versioning and migration management. The foundation for reproducible, version-controlled database changes across environments is now in place.

## Deliverables

### 1. Alembic Configuration

✅ **backend/alembic.ini** — Alembic main configuration
- Database URL loaded from environment variable
- Logging configuration for migration output
- Migration script location and naming patterns
- Production-ready PostgreSQL settings

✅ **backend/alembic/env.py** — Runtime environment configuration
- Loads SQLAlchemy models automatically
- Integrates with .env for DATABASE_URL
- Supports both online and offline migration modes
- Auto-imports all models (Site, Selector, DetectionEvent, RepairOutcome, ApiKey)

✅ **backend/alembic/script.py.mako** — Migration file template
- Standard Alembic template for new migrations
- Generates `upgrade()` and `downgrade()` functions

✅ **backend/alembic/__init__.py** — Package marker

✅ **backend/alembic/versions/__init__.py** — Package marker

### 2. Initial Migration

✅ **backend/alembic/versions/001_initial_schema.py** — Foundation schema
- **Creates 5 tables**:
  - `sites` — Customer websites (owner_id, name, url, is_active, timestamps)
  - `selectors` — Selectors with repair history (site_id FK, repair_method, repair_status)
  - `detection_events` — Change detection logs (site_id FK, selector_id FK, signal_type, confidence)
  - `repair_outcomes` — Repair audit trail (selector_id FK, status, failure_reason)
  - `api_keys` — API authentication (owner_id, key_hash, is_revoked, last_used_at)

- **Creates indexes** for performance:
  - Sites: `(owner_id, is_active)` for customer lookups
  - Selectors: `(site_id, is_current)` for active selector queries
  - Detection: `(site_id, detected_at)` for time-series queries
  - Repair outcomes: `(selector_id, timestamp)`, `(status)` for analysis
  - API keys: `(key_hash)` for fast lookups

- **Foreign keys with CASCADE delete**:
  - Selectors → Sites (CASCADE)
  - DetectionEvents → Sites (CASCADE)
  - DetectionEvents → Selectors (SET NULL)
  - RepairOutcomes → Selectors (CASCADE)

- **Includes complete upgrade/downgrade logic**:
  - `upgrade()` — Creates all tables and indexes
  - `downgrade()` — Drops all tables in correct dependency order

### 3. Utility Scripts

✅ **backend/init_db.py** — Initialize database (updated from Phase 1)
- Runs Alembic migrations to create schema
- Loads DATABASE_URL from .env
- Reports success/failure with helpful messages
- Lists all created tables
- Production-ready with error handling

✅ **backend/reset_db.py** — Reset database (development/testing)
- Interactive confirmation to prevent accidental data loss
- Downgrades to base (drops all tables)
- Re-applies all migrations for clean state
- Useful for test cleanup in CI/CD pipelines

### 4. Schema Reference

✅ **backend/schema.sql** — Reference SQL schema
- Shows complete PostgreSQL schema in SQL (not ORM syntax)
- Includes comments on enum-like values (signal_type, repair_method, status)
- Documents index strategy and compound keys
- Provides sample query patterns for common operations
- Useful for documentation, import into DB tools, or manual reference

### 5. Dependencies

✅ **requirements.txt** — Updated with Alembic
- SQLAlchemy==2.0.23
- psycopg2-binary==2.9.9
- python-dotenv==1.0.0
- **alembic==1.13.1** ← NEW
- pytest==7.4.3
- pytest-asyncio==0.21.1

### 6. Testing

✅ **backend/tests/test_migrations.py** — Comprehensive migration tests
- Test upgrade to head
- Verify all 5 tables exist
- Verify column types and presence for each table
- Verify all indexes are created
- Verify foreign key constraints are in place
- Test downgrade back to base
- Test re-upgrade after downgrade

Tests ensure:
- ✅ Migrations run without errors
- ✅ Schema structure is correct
- ✅ Indexes exist and are named correctly
- ✅ Foreign keys enable referential integrity
- ✅ Rollback works properly

### 7. Documentation

✅ **MIGRATIONS.md** — Complete migration guide
- Setup instructions (3 steps)
- Common commands (upgrade, downgrade, status, history)
- How to create new migrations
- File structure and explanation
- Migration 001 detailed breakdown
- Best practices (✅ DO and ❌ DON'T)
- Troubleshooting common issues
- Production deployment checklist
- Testing instructions

✅ **PHASE2_SUMMARY.md** — This file

## How to Use

### First-Time Setup

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Copy environment template
cp .env.example .env

# 3. Edit DATABASE_URL in .env
# DATABASE_URL=postgresql://user:password@localhost:5432/driftlock_dev

# 4. Initialize database (creates tables)
python backend/init_db.py
```

Output:
```
Initializing DriftLock database...
Database: postgresql://user:password@localhost:5432/driftlock_dev

▶ Running migrations...
✓ Migrations completed successfully

▶ Created tables:
  - sites
  - selectors
  - detection_events
  - repair_outcomes
  - api_keys
  - alembic_version (migration tracking)

✓ Database initialization complete!
```

### Check Migration Status

```bash
cd backend
alembic current
```

Output:
```
001
```

### Apply New Migrations (After Changes)

```bash
# 1. Modify a model in backend/models/
# 2. Generate migration
cd backend && alembic revision --autogenerate -m "describe_change"

# 3. Review generated migration in versions/
# 4. Apply it
cd backend && alembic upgrade head
```

### Rollback a Migration

```bash
# Go back one migration
cd backend && alembic downgrade -1

# Go back to a specific migration
cd backend && alembic downgrade 001

# Drop all tables (downgrade to base)
cd backend && alembic downgrade base
```

### Reset Database (Development Only)

```bash
python backend/reset_db.py
```

Prompts for confirmation, then drops and recreates all tables.

### Run Migration Tests

```bash
pytest backend/tests/test_migrations.py -v
```

Verifies all tables, columns, indexes, and foreign keys.

## Key Features

### 1. Version Control
- Migration history tracked in `alembic_version` table
- Can see what's deployed: `alembic current`
- Can see all migrations: `alembic history`

### 2. Reproducible Deployments
```bash
# Same command runs on dev, staging, prod
alembic upgrade head
```

No manual SQL scripts. No "run this script on prod only." Schema changes are reproducible.

### 3. Rollback Capability
```bash
alembic downgrade -1
```

If a migration causes problems, rollback immediately with downgrade.

### 4. Auto-generation
```bash
alembic revision --autogenerate
```

Detects model changes and generates migration code automatically. Requires review before applying.

### 5. Cascading Deletes
When a site is deleted:
- ✅ All its selectors are deleted
- ✅ All detection events for those selectors are deleted
- ✅ All repair outcomes are deleted
- ✅ No orphaned data

## Files Created

```
DriftLock/
├── MIGRATIONS.md                 # Complete migration guide
├── PHASE2_SUMMARY.md             # This file
├── requirements.txt              # Updated with alembic
└── backend/
    ├── init_db.py                # Initialize (updated)
    ├── reset_db.py               # Reset database
    ├── schema.sql                # Reference schema
    ├── alembic.ini               # Alembic configuration
    ├── alembic/
    │   ├── __init__.py
    │   ├── env.py                # Runtime configuration
    │   ├── script.py.mako        # Migration template
    │   └── versions/
    │       ├── __init__.py
    │       └── 001_initial_schema.py  # Foundation migration
    └── tests/
        ├── test_models.py        # Model tests (Phase 1)
        └── test_migrations.py    # Migration tests (Phase 2)
```

## Migration Workflow

### Adding a New Column

1. **Modify model** in `backend/models/selector.py`:
```python
retry_count = Column(Integer, default=0)
```

2. **Generate migration**:
```bash
cd backend && alembic revision --autogenerate -m "add_retry_count_to_selectors"
```

3. **Review** `backend/alembic/versions/002_add_retry_count_to_selectors.py`

4. **Apply**:
```bash
cd backend && alembic upgrade head
```

5. **Test rollback**:
```bash
cd backend && alembic downgrade -1
cd backend && alembic upgrade head
```

### Adding a New Table

1. **Create model** in `backend/models/webhook.py`:
```python
class Webhook(Base):
    __tablename__ = "webhooks"
    # ... fields
```

2. **Import in** `backend/models/__init__.py`

3. **Generate migration**:
```bash
cd backend && alembic revision --autogenerate -m "create_webhooks_table"
```

4. **Review and apply** same as above

## Deployment Checklist

Before deploying to production:

- [ ] All migrations tested in local dev
- [ ] Database backup taken
- [ ] Downtime window scheduled (if needed)
- [ ] Rollback plan documented
- [ ] Tested on staging environment
- [ ] Run: `cd backend && alembic upgrade head`
- [ ] Verify: `cd backend && alembic current`
- [ ] Run smoke tests

## Status

✅ **Phase 2 Complete** — Migration system ready for production

All Alembic components created with:
- ✅ Version-controlled schema
- ✅ Reproducible deployments
- ✅ Complete rollback capability
- ✅ Cascading foreign keys
- ✅ Production-ready configuration
- ✅ Comprehensive test coverage
- ✅ Clear documentation

Person 1 can now:
- Create API endpoints using the migrated schema
- Add new models and generate migrations safely
- Deploy with confidence using `alembic upgrade head`

Person 2 knows the schema is stable, version-controlled, and can be rolled back if needed.

## Next Steps

### For Person 1 (Backend)
- Use the migrated schema in FastAPI routes
- Add new models as needed and generate migrations
- Use `get_db()` from `backend.models.base` for database access
- Test schema changes with: `pytest backend/tests/test_migrations.py`

### For Person 2 (Frontend)
- API schema is stable (defined in DATABASE.md)
- Backend endpoints available for site/selector/detection queries
- Database changes will be version-controlled and rollback-safe

### For Deployment
```bash
# On staging or production
python backend/init_db.py  # One-time setup
cd backend && alembic upgrade head  # Apply future migrations
```
