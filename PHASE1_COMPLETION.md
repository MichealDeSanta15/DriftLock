# Story 1, Phase 1: Database Models & Setup — COMPLETE

## Summary

Successfully built the PostgreSQL database foundation for DriftLock with SQLAlchemy ORM models, proper indexing, relationships, and initialization utilities.

## Deliverables

### 1. Core Models Created

#### `backend/models/base.py`
- SQLAlchemy declarative base (`Base`)
- Database engine connection utilities
- Helper functions:
  - `generate_uuid()` — UUID string generation for PKs
  - `utc_now()` — Current UTC timestamp

#### `backend/models/site.py` — Site Model
- **Table:** `sites`
- **Fields:** id, name, url, owner_id, created_at, updated_at, is_active
- **Index:** `idx_owner_is_active` (owner_id, is_active) for customer lookups
- **Relationships:**
  - `selectors` → Selector (cascade delete)
  - `detection_events` → DetectionEvent (cascade delete)

#### `backend/models/selector.py` — Selector Model
- **Table:** `selectors`
- **Fields:** id, site_id, selector_key, is_current, repair_count, last_repaired_at, old_selector, new_selector, repair_method, repair_status, created_at, updated_at
- **Indexes:**
  - `idx_site_is_current` (site_id, is_current) for active selector lookups
  - `idx_selector_key` (selector_key) for string searches
- **Relationships:**
  - `site` → Site
  - `detection_events` → DetectionEvent (cascade delete)
  - `repair_outcomes` → RepairOutcome (cascade delete)

#### `backend/models/detection_event.py` — Detection Event Model
- **Table:** `detection_events`
- **Fields:** id, site_id, selector_id, detected_at, signal_type, confidence, created_at, updated_at
- **Signal types:** hash_change, dom_diff, template_shift
- **Index:** `idx_site_detected_at` (site_id, detected_at) for time-range queries
- **Relationships:**
  - `site` → Site
  - `selector` → Selector

#### `backend/models/repair_outcome.py` — Repair Outcome Model
- **Table:** `repair_outcomes`
- **Fields:** id, selector_id, old_selector, new_selector, repair_method, status, timestamp, confidence, error_message, created_at, updated_at
- **Status values:** success, failed, pending
- **Indexes:**
  - `idx_selector_timestamp` (selector_id, timestamp) for repair history
  - `idx_repair_status` (status) for status-based queries
- **Relationships:**
  - `selector` → Selector

#### `backend/models/api_key.py` — API Key Model
- **Table:** `api_keys`
- **Fields:** id, owner_id, key_hash, is_revoked, last_used_at, created_at, updated_at
- **Index:** `idx_key_hash` (key_hash) for fast auth lookups
- **Security:** Keys stored as SHA256 hashes (plaintext never stored)

### 2. Configuration & Setup

#### `backend/db.py` — Updated
- Updated to import Base from `backend.models.base`
- Existing database connection and session management preserved
- `init_db()` function creates all tables from models

#### `backend/models/__init__.py` — Updated
- Exports all models and utilities
- Clean public API for importing models

#### `backend/.env.example`
- Documented required environment variables:
  - `DATABASE_URL` — PostgreSQL connection string
  - `SQL_ECHO` — SQL query logging (false by default)
  - `LOG_LEVEL` — Logging verbosity

### 3. Utilities & Documentation

#### `backend/init_models.py`
Command-line utility for database initialization:
```bash
python backend/init_models.py init    # Create tables
python backend/init_models.py drop    # Drop tables (development only)
python backend/init_models.py demo    # Create tables + demo data
```

#### `DATABASE_MODELS.md`
- Complete schema documentation
- Column definitions with constraints
- Index strategy and usage
- Relationship diagrams
- Query examples
- Usage patterns for each model

## Quality Checklist

✅ SQLAlchemy ORM with full type hints
✅ Declarative base with proper configuration
✅ All models have `__tablename__` and `__repr__`
✅ All models have `created_at` and `updated_at` timestamps
✅ No hardcoded secrets (DATABASE_URL from .env)
✅ UUID or auto-increment primary keys (UUID strings)
✅ Docstrings on all classes and methods
✅ PEP 8 compliant code
✅ Proper relationships with cascade delete
✅ Strategic indexes for common queries:
   - (owner_id, is_active) for customer site lookups
   - (site_id, is_current) for active selectors
   - (site_id, detected_at) for detection history
   - (selector_id, timestamp) for repair history
   - (status) for repair status aggregation
   - (key_hash) for API key authentication

## Architecture Notes

- **UUID Strategy:** All primary keys are 36-character UUID strings for security and horizontal scaling
- **Cascade Delete:** Foreign key relationships use CASCADE to maintain database consistency when records are deleted
- **Timestamps:** All tables use UTC timezone-aware datetime fields
- **API Keys:** Stored as SHA256 hashes; plaintext keys never persisted
- **Status Fields:** Using string enums (status, repair_status) for flexibility during early development before migration to proper enums

## Next Steps

1. **Phase 2:** Create Alembic migrations for version control
2. **Phase 3:** Implement backend API endpoints for CRUD operations
3. **Phase 4:** Add detection signal processors and repair algorithms
4. **Testing:** Write pytest fixtures using these models for integration testing

## Usage

### Quick Start

```python
from backend.models import Site, Selector, generate_uuid
from backend.db import SessionLocal

session = SessionLocal()

# Create a site
site = Site(
    id=generate_uuid(),
    name="My Website",
    url="https://example.com",
    owner_id="customer-123",
    is_active=True
)
session.add(site)
session.commit()
```

See `DATABASE_MODELS.md` for comprehensive examples.

---

**Status:** ✅ Complete — All Story 1, Phase 1 requirements met
**Date:** 2026-07-29
**Commit Ready:** Yes
