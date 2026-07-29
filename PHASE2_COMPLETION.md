# Story 1, Phase 2: Alembic Migrations — COMPLETE

## Summary

Successfully set up Alembic for database migrations with the initial schema migration, database initialization utilities, and production-ready migration management.

## Deliverables

### 1. Alembic Directory Structure

#### `backend/alembic/`
```
alembic/
├── __init__.py
├── env.py                           # Runtime configuration
├── script.py.mako                   # Migration template
└── versions/
    ├── __init__.py
    └── 001_initial_schema.py        # Initial migration
```

### 2. Core Configuration Files

#### `backend/alembic.ini`
- Alembic configuration with SQLAlchemy settings
- Pool pre-ping for connection health checks
- Logging configuration
- Migration file naming conventions

#### `backend/alembic/env.py`
- Database URL resolution from environment
- SQLAlchemy model metadata integration
- Offline and online migration mode support
- Proper error handling for missing DATABASE_URL

#### `backend/alembic/script.py.mako`
- Template for auto-generating migration files
- Consistent migration structure across new files

### 3. Initial Migration

#### `backend/alembic/versions/001_initial_schema.py`

Creates the complete initial database schema:

**Tables Created:**
- `sites` — Monitored websites
  - Columns: id, name, url, owner_id, created_at, updated_at, is_active
  - Index: (owner_id, is_active)

- `selectors` — CSS/XPath selectors
  - Columns: id, site_id, selector_key, created_at, updated_at, is_current, repair_count, last_repaired_at, old_selector, new_selector, repair_method, repair_status
  - Indexes: (site_id, is_current), selector_key, site_id
  - Foreign Key: site_id → sites (CASCADE DELETE)

- `detection_events` — Detection logs
  - Columns: id, site_id, selector_id, detected_at, signal_type, confidence, created_at, updated_at
  - Index: (site_id, detected_at), selector_id
  - Foreign Keys: site_id → sites (CASCADE), selector_id → selectors (CASCADE)

- `repair_outcomes` — Repair history
  - Columns: id, selector_id, old_selector, new_selector, repair_method, status, timestamp, created_at, updated_at, confidence, error_message
  - Indexes: (selector_id, timestamp), status
  - Foreign Key: selector_id → selectors (CASCADE DELETE)

- `api_keys` — Customer authentication
  - Columns: id, owner_id, key_hash, created_at, updated_at, last_used_at, is_revoked
  - Indexes: key_hash, owner_id
  - Unique constraint on key_hash

**Features:**
- Fully reversible (upgrade and downgrade functions)
- CASCADE DELETE on all foreign keys for data consistency
- Strategic indexes for common query patterns
- Server defaults for boolean and status columns
- Timezone-aware datetime columns

### 4. Database Initialization Utilities

#### `backend/init_db.py`
Command-line script to initialize the database by running all migrations:

```bash
python backend/init_db.py
```

**Features:**
- Reads DATABASE_URL from .env
- Validates Alembic configuration
- Runs all pending migrations to "head"
- Clear success/error messages
- Production-ready initialization

#### `backend/reset_db.py`
Development utility to reset the database (with safety confirmation):

```bash
# Reset: downgrade to base, then upgrade to head
python backend/reset_db.py reset

# Drop: just remove all tables
python backend/reset_db.py drop
```

**Features:**
- Production database protection (refuses to run on "production" or "prod" databases)
- Interactive confirmation required before destructive operations
- Two modes: reset (downgrade+upgrade) or drop (clean removal)
- Detailed step-by-step feedback
- Safe table-by-table teardown with CASCADE handling

### 5. Reference Documentation

#### `backend/schema.sql`
SQL reference file showing the final schema:

**Contents:**
- Table definitions in PostgreSQL syntax
- Column constraints and defaults
- Index definitions
- Foreign key relationships
- Sample query examples
- Relationship diagram in comments

**Purpose:**
- Quick reference for database structure
- Can be used for manual schema review
- Documentation for non-Alembic tools
- Example queries for common operations

#### `backend/.env.example`
Environment configuration template:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/driftlock
SQL_ECHO=false
LOG_LEVEL=INFO
```

## Usage Guide

### First-Time Setup

1. **Configure environment:**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with actual database credentials
   ```

2. **Initialize database:**
   ```bash
   cd backend
   python init_db.py
   ```

### Regular Operations

**Apply migrations:**
```bash
cd backend
alembic upgrade head
```

**Check status:**
```bash
cd backend
alembic current
alembic history
```

**Downgrade (if needed):**
```bash
cd backend
alembic downgrade -1      # Revert one migration
alembic downgrade base    # Revert all migrations
```

### Development

**Create new migration (after model changes):**
```bash
cd backend
alembic revision --autogenerate -m "describe_change"
alembic upgrade head
```

**Reset for testing:**
```bash
cd backend
python reset_db.py reset
```

## Quality Checklist

✅ Alembic initialized with proper structure
✅ Migration template consistent with project patterns
✅ Initial migration creates all 5 required tables
✅ All foreign keys use CASCADE DELETE
✅ All indexes match DATABASE_MODELS.md
✅ Migration is fully reversible (upgrade and downgrade)
✅ Environment configuration via .env
✅ Database protection against production resets
✅ Clear error messages and validation
✅ Comprehensive SQL reference schema
✅ Safe initialization and reset utilities

## Architecture Notes

### Migration Strategy
- **Numbered revisions** (001, 002, ...) for clarity
- **Reversible functions** for safe rollbacks
- **Server defaults** for proper data consistency
- **CASCADE DELETE** for referential integrity
- **Type hints** throughout for IDE support

### Production Ready
- DATABASE_URL from environment (no hardcoded secrets)
- Production database protection in reset_db.py
- Transactional migration wrapping by Alembic
- Connection pooling and health checks
- Clear logging of migration steps

### Performance Considerations
- Indexes on all foreign keys (faster joins)
- Composite indexes for common query patterns
- String PKs (UUIDs) for horizontal scaling
- Proper column types (TEXT for arbitrary length, Integer for counts)

## Next Steps

1. **Testing** — Add pytest fixtures for migration testing
2. **API Development** — Create endpoints that use the schema
3. **Detection Logic** — Implement signals that populate detection_events
4. **Repair System** — Build repair logic that records outcomes
5. **Additional Migrations** — Add features as needed with `alembic revision --autogenerate`

## Integration with Phase 1

The migration system integrates seamlessly with the SQLAlchemy models from Phase 1:

- `env.py` imports `Base` from `backend.models.base`
- Migration files can auto-generate from model changes
- Existing models are used as the source of truth
- Downtime-free deployments possible with careful migration design

## Files Summary

| File | Purpose | Status |
|------|---------|--------|
| `backend/alembic.ini` | Alembic configuration | ✅ Complete |
| `backend/alembic/env.py` | Runtime setup | ✅ Complete |
| `backend/alembic/script.py.mako` | Migration template | ✅ Complete |
| `backend/alembic/versions/001_initial_schema.py` | Initial schema | ✅ Complete |
| `backend/init_db.py` | Initialize database | ✅ Complete |
| `backend/reset_db.py` | Reset database (dev) | ✅ Complete |
| `backend/schema.sql` | SQL reference | ✅ Complete |
| `backend/.env.example` | Configuration template | ✅ Complete |

---

**Status:** ✅ Complete — All Story 1, Phase 2 requirements met
**Date:** 2026-07-29
**Commit Ready:** Yes
