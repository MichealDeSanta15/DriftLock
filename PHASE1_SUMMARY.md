# Story 1, Phase 1: Database Setup — COMPLETED

## Overview
Person 3 (DevOps/Integration) has built the PostgreSQL database foundation that Person 1 (backend) and Person 2 (frontend) will use.

## Deliverables

### 1. Core Models (backend/models/)

✅ **base.py** — SQLAlchemy Configuration
- Engine setup with PostgreSQL connection via `DATABASE_URL`
- Session factory (`SessionLocal`) for database operations
- `get_db()` dependency injection function for FastAPI
- `init_db()` function to create all tables
- Environment variable loading via `python-dotenv`
- Pool connection management with `pool_pre_ping=True`

✅ **site.py** — Site Model
- **Fields**: id (UUID), owner_id, name, url, is_active, created_at, updated_at
- **Index**: `(owner_id, is_active)` for fast customer lookups
- **Relationships**: `selectors`, `detection_events` with cascading delete
- Fully typed with docstring

✅ **selector.py** — Selector Model  
- **Fields**: id, site_id (FK), selector_key, old_selector, new_selector, repair_method, repair_status, is_current, repair_count, last_repaired_at, created_at, updated_at
- **Repair Methods**: backup_key, json_ld, reverse_search, manual
- **Repair Status**: pending, success, failed
- **Indexes**: `(site_id, is_current)`, `(selector_key)`
- **Relationships**: site (back-ref), repair_outcomes, detection_events

✅ **detection_event.py** — Detection Log Model
- **Fields**: id, site_id (FK), selector_id (FK), signal_type, confidence (0.0-1.0), detection_details, detected_at, created_at
- **Signal Types**: hash_change, dom_diff, template_shift, content_change
- **Indexes**: `(site_id, detected_at)` for recent change queries, `(selector_id)`
- **Relationships**: site, selector

✅ **repair_outcome.py** — Repair History Model
- **Fields**: id, selector_id (FK), old_selector, new_selector, repair_method, status, failure_reason, validation_result, timestamp, created_at
- **Status Values**: success, failed, pending
- **Indexes**: `(selector_id, timestamp)`, `(status)` for outcome analysis
- **Relationships**: selector
- Audit trail for ML model training

✅ **api_key.py** — API Key Model
- **Fields**: id, owner_id, key_hash (unique), name, is_revoked, last_used_at, created_at, updated_at
- **Indexes**: `(key_hash)`, `(owner_id)`
- Stores hashed keys only (no plaintext secrets)
- Usage tracking with `last_used_at`

✅ **__init__.py** — Package initialization
- Clean exports of all models and utilities
- Enables `from backend.models import Site, Selector, ...`

### 2. Setup & Configuration

✅ **.env.example** — Environment template
```
DATABASE_URL=postgresql://user:password@localhost:5432/driftlock_dev
ENVIRONMENT=development
DEBUG=true
DEMO_API_KEY=sk_test_changeme
```

✅ **requirements.txt** — Python dependencies
- SQLAlchemy 2.0.23 (latest with async support)
- psycopg2-binary (PostgreSQL driver)
- python-dotenv (environment management)
- pytest & pytest-asyncio (testing)

✅ **backend/init_db.py** — Database initialization script
- Executable Python script to create all tables
- Prints confirmation and table names
- Error handling with helpful messages

### 3. Testing

✅ **backend/tests/test_models.py** — Comprehensive test suite
- Test site creation and persistence
- Test selector creation with relationships
- Test detection event logging
- Test repair outcome tracking
- Test API key creation
- Test Site→Selector relationship
- Fixture-based database setup/teardown

✅ **backend/tests/__init__.py** — Package marker

### 4. Documentation

✅ **DATABASE.md** — Complete database guide
- Schema overview
- Setup instructions (3 steps)
- Detailed field documentation for each model
- Design decision rationale
- Next steps for Person 1 & Person 2

✅ **PHASE1_SUMMARY.md** — This file

## Design Highlights

### UUID Primary Keys
- Database-agnostic and distributed-system friendly
- Auto-generated with `uuid.uuid4()`

### Timestamps
- All models include `created_at` and `updated_at`
- Automatic defaults and updates via SQLAlchemy
- Enables audit trails and time-series queries

### Cascading Deletes
- Selector and DetectionEvent cascade on Site deletion
- Maintains referential integrity
- RepairOutcome cascades on Selector deletion

### Indexing Strategy
- Customer lookups: `(owner_id, is_active)`
- Active selector queries: `(site_id, is_current)`
- Time-series queries: `(site_id, detected_at)`, `(selector_id, timestamp)`
- Fast key lookups: `(key_hash)`

### Confidence Scoring
- DetectionEvent stores ML confidence (0.0-1.0)
- Enables threshold tuning without schema changes

### Audit Trail
- RepairOutcome logs every repair attempt
- Captures success/failure + method
- Fields for debugging (failure_reason, validation_result)
- Ready for ML model training

## How to Use

### 1. Setup Database

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your PostgreSQL credentials
# DATABASE_URL=postgresql://user:password@localhost:5432/driftlock_dev

# Install dependencies
pip install -r requirements.txt

# Create tables
python backend/init_db.py
```

### 2. Use Models in Backend (Person 1)

```python
from backend.models import SessionLocal, Site, Selector, DetectionEvent
from backend.models.base import get_db

# In a FastAPI route
@app.get("/sites/{site_id}")
async def get_site(site_id: str, db = Depends(get_db)):
    site = db.query(Site).filter_by(id=site_id).first()
    return {"site": site, "selectors": site.selectors}

# Create new detection
detection = DetectionEvent(
    site_id=site_id,
    signal_type="hash_change",
    confidence=0.92,
    detection_details=json.dumps({"old": "abc", "new": "def"})
)
db.add(detection)
db.commit()
```

### 3. Use Models in Frontend (Person 2)

```typescript
// Call backend API which queries these models
const response = await fetch(`/api/sites/${siteId}`);
const { site, selectors } = await response.json();
```

### 4. Run Tests

```bash
pytest backend/tests/test_models.py -v
```

## Files Created

```
DriftLock/
├── .env.example                          # Environment template
├── requirements.txt                      # Python dependencies
├── DATABASE.md                           # Database documentation
├── PHASE1_SUMMARY.md                     # This file
└── backend/
    ├── __init__.py                       # Package marker
    ├── init_db.py                        # Database initialization script
    ├── detection/
    │   └── __init__.py                   # Placeholder for Person 1
    ├── repair/
    │   └── __init__.py                   # Placeholder for Person 1
    ├── models/
    │   ├── __init__.py                   # Model exports
    │   ├── base.py                       # SQLAlchemy setup
    │   ├── site.py                       # Site model
    │   ├── selector.py                   # Selector model
    │   ├── detection_event.py            # DetectionEvent model
    │   ├── repair_outcome.py             # RepairOutcome model
    │   └── api_key.py                    # ApiKey model
    └── tests/
        ├── __init__.py                   # Test package marker
        └── test_models.py                # Model tests
```

## Coordination Notes

### For Person 1 (Backend)
- Use `get_db()` from `backend.models.base` for FastAPI dependency injection
- Detection logic goes in `backend/detection/`
- Repair logic goes in `backend/repair/`
- Create and commit objects to models using SessionLocal
- Test with `pytest backend/tests/test_models.py`

### For Person 2 (Frontend)
- API endpoints in `src/app/api/` will query these models via Person 1's backend
- Schema is ready—no migrations needed yet
- Frontend receives JSON from Person 1's API routes
- Can reference DATABASE.md for field meanings

## Status
✅ **Phase 1 Complete** — Database foundation ready for development

All 6 models created with:
- ✅ Type hints (PEP 484)
- ✅ Docstrings (PEP 257)
- ✅ SQLAlchemy ORM patterns
- ✅ UUID primary keys
- ✅ Timestamps on all models
- ✅ Strategic indexing
- ✅ Relationships & cascading
- ✅ Test coverage
- ✅ Documentation

Person 1 and Person 2 can now begin implementation knowing the database contract is stable.
