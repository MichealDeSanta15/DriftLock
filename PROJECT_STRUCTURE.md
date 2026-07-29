# DriftLock Project Structure (After Phase 2)

Complete file and directory structure after database setup and migrations.

## Root Level

```
DriftLock/
├── .git/                           # Git repository
├── .env.example                    # Environment template (copy to .env)
├── requirements.txt                # Python dependencies
├── README.md                       # Project overview
├── SPEC.md                         # Project specification
├── CLAUDE.md                       # Codebase conventions
├── DATABASE.md                     # Database model documentation
├── MIGRATIONS.md                   # Alembic migration guide
├── PROJECT_STRUCTURE.md            # This file
├── PHASE1_SUMMARY.md              # Phase 1 deliverables
└── PHASE2_SUMMARY.md              # Phase 2 deliverables
```

## Backend Structure

```
backend/
├── __init__.py                     # Package marker
├── init_db.py                      # Initialize database (run migrations)
├── reset_db.py                     # Reset database (dev/test only)
├── schema.sql                      # Reference PostgreSQL schema
│
├── models/                         # SQLAlchemy ORM models
│   ├── __init__.py                 # Model exports
│   ├── base.py                     # SQLAlchemy engine, session, Base
│   ├── site.py                     # Site model (customers' websites)
│   ├── selector.py                 # Selector model (CSS/XPath selectors)
│   ├── detection_event.py          # DetectionEvent model (change logs)
│   ├── repair_outcome.py           # RepairOutcome model (audit trail)
│   └── api_key.py                  # ApiKey model (authentication)
│
├── alembic/                        # Database migrations
│   ├── __init__.py
│   ├── env.py                      # Alembic runtime configuration
│   ├── script.py.mako              # Migration file template
│   └── versions/                   # Migration files
│       ├── __init__.py
│       └── 001_initial_schema.py  # Initial schema (sites, selectors, etc.)
│
├── alembic.ini                     # Alembic configuration file
│
├── detection/                      # Detection logic (Person 1 to fill)
│   └── __init__.py                 # Placeholder for change detection
│
├── repair/                         # Repair logic (Person 1 to fill)
│   └── __init__.py                 # Placeholder for selector repair
│
└── tests/                          # Test suite
    ├── __init__.py
    ├── test_models.py              # ORM model tests (Phase 1)
    └── test_migrations.py          # Migration tests (Phase 2)
```

## Frontend Structure (Placeholder)

```
src/                               # Next.js frontend (Person 2)
├── app/                           # App Router pages
├── components/                    # React components
├── lib/                           # Utilities (Supabase client, etc.)
└── api/                           # API routes (integrates with Person 1 backend)
```

## File Inventory

### Configuration Files

| File | Purpose | Status |
|------|---------|--------|
| `.env.example` | Environment template | ✅ Created |
| `requirements.txt` | Python dependencies (with alembic) | ✅ Updated |
| `backend/alembic.ini` | Alembic configuration | ✅ Created |

### Documentation

| File | Purpose | Phase |
|------|---------|-------|
| `README.md` | Project overview | Initial |
| `SPEC.md` | Product specification | Initial |
| `CLAUDE.md` | Coding conventions | Initial |
| `DATABASE.md` | Model documentation | Phase 1 |
| `MIGRATIONS.md` | Migration guide | Phase 2 |
| `PHASE1_SUMMARY.md` | Phase 1 deliverables | Phase 1 |
| `PHASE2_SUMMARY.md` | Phase 2 deliverables | Phase 2 |
| `PROJECT_STRUCTURE.md` | This file | Phase 2 |

### Database Models (Phase 1)

| File | Model | Fields | Status |
|------|-------|--------|--------|
| `backend/models/base.py` | (Configuration) | Engine, SessionLocal, Base | ✅ |
| `backend/models/site.py` | Site | id, owner_id, name, url, is_active, created_at, updated_at | ✅ |
| `backend/models/selector.py` | Selector | id, site_id, selector_key, old/new_selector, repair_method, repair_status, is_current, repair_count, last_repaired_at, created_at, updated_at | ✅ |
| `backend/models/detection_event.py` | DetectionEvent | id, site_id, selector_id, signal_type, confidence, detection_details, detected_at, created_at | ✅ |
| `backend/models/repair_outcome.py` | RepairOutcome | id, selector_id, old/new_selector, repair_method, status, failure_reason, validation_result, timestamp, created_at | ✅ |
| `backend/models/api_key.py` | ApiKey | id, owner_id, key_hash, name, is_revoked, last_used_at, created_at, updated_at | ✅ |

### Migrations (Phase 2)

| File | Migration | Creates | Status |
|------|-----------|---------|--------|
| `backend/alembic/versions/001_initial_schema.py` | 001 | sites, selectors, detection_events, repair_outcomes, api_keys tables + indexes + foreign keys | ✅ |

### Scripts (Phase 2)

| File | Purpose | Status |
|------|---------|--------|
| `backend/init_db.py` | Initialize database (runs migrations) | ✅ Updated |
| `backend/reset_db.py` | Reset database for testing | ✅ Created |

### Reference Files (Phase 2)

| File | Purpose | Status |
|------|---------|--------|
| `backend/schema.sql` | PostgreSQL schema reference | ✅ Created |

### Tests

| File | Tests | Status |
|------|-------|--------|
| `backend/tests/test_models.py` | ORM models, relationships, persistence | ✅ Phase 1 |
| `backend/tests/test_migrations.py` | Migration upgrade/downgrade, table/index/FK creation | ✅ Phase 2 |

## Dependencies

```
SQLAlchemy==2.0.23          # ORM for database models
psycopg2-binary==2.9.9      # PostgreSQL driver
python-dotenv==1.0.0        # Environment variable management
alembic==1.13.1             # Database migrations
pytest==7.4.3               # Testing framework
pytest-asyncio==0.21.1      # Async test support
```

## Development Workflow

### Phase 1: Database Models ✅ COMPLETE
- Created SQLAlchemy ORM models
- Defined relationships and indexes
- Added test coverage

### Phase 2: Database Migrations ✅ COMPLETE
- Set up Alembic for schema versioning
- Created initial migration with all tables
- Added rollback capability
- Created utility scripts (init, reset)
- Added migration tests

### Phase 3: Backend API (Ready for Person 1)
```
Person 1 will:
├── Create FastAPI application
├── Add API routes in src/app/api/
├── Use get_db() from backend.models.base
├── Implement detection logic in backend/detection/
├── Implement repair logic in backend/repair/
└── Write integration tests
```

### Phase 4: Frontend (Ready for Person 2)
```
Person 2 will:
├── Create Next.js pages in src/app/
├── Build React components in src/components/
├── Create API client in src/lib/
├── Call Person 1's backend API
└── Integrate Supabase for authentication
```

## Key Design Decisions

### Database
- **UUID Primary Keys**: Distributed system safe
- **Timestamps on All Models**: Audit trail and time-series queries
- **Cascading Deletes**: Site deletion removes selectors, detection events, repair outcomes
- **Strategic Indexing**: Compound indexes for common query patterns

### Migrations
- **Alembic for Version Control**: Reproducible deployments
- **Auto-generation Support**: Can detect and generate migrations from model changes
- **Rollback Capability**: `alembic downgrade` reverses any migration
- **Production Ready**: Used in thousands of production systems

### Code Organization
- **Models in backend/models/**: Clear separation of concerns
- **Migrations in backend/alembic/**: Standard Alembic layout
- **Tests parallel to code**: backend/tests/ mirrors backend/ structure

## Common Tasks

### First-Time Setup
```bash
cp .env.example .env
pip install -r requirements.txt
python backend/init_db.py
```

### Run Tests
```bash
pytest backend/tests/
```

### Check Migration Status
```bash
cd backend
alembic current
alembic history
```

### Create New Migration
```bash
# 1. Modify model in backend/models/
# 2. Generate migration
cd backend && alembic revision --autogenerate -m "description"
# 3. Apply
cd backend && alembic upgrade head
```

### Reset Database (Dev Only)
```bash
python backend/reset_db.py
```

## Coordination Points

### For Person 1 (Backend)
- Models are ready in `backend/models/`
- Database is initialized with `python backend/init_db.py`
- Use `get_db()` from `backend.models.base` in FastAPI routes
- Add detection/repair logic in `backend/detection/` and `backend/repair/`
- Create migrations with `alembic revision --autogenerate` as schema changes

### For Person 2 (Frontend)
- Database schema is stable and documented in `DATABASE.md`
- Models define the API contract (field types, relationships)
- Backend API routes (Person 1) will expose this data as JSON
- Frontend receives structured data from Person 1's endpoints

### For Deployment
- All schema changes are version-controlled in `backend/alembic/versions/`
- Single command to deploy: `alembic upgrade head`
- Can rollback with: `alembic downgrade -1`
- Database is production-ready with indexes and foreign keys

## Success Criteria

Phase 1 ✅
- [x] All 6 models created with type hints
- [x] Relationships and cascades working
- [x] Tests pass

Phase 2 ✅
- [x] Alembic initialized and configured
- [x] Migration 001 creates all tables with indexes
- [x] Foreign keys with CASCADE delete
- [x] Rollback works (upgrade/downgrade)
- [x] init_db.py runs migrations
- [x] reset_db.py rebuilds schema
- [x] Migration tests pass

Phase 3 (Ready)
- Person 1: Create API routes with Person 1's backend
- Person 2: Build frontend consuming Person 1's API

## Status

🟢 **Phases 1 & 2 Complete**

Database foundation is production-ready with:
- ✅ SQLAlchemy ORM models
- ✅ Alembic migrations
- ✅ Version control for schema
- ✅ Rollback capability
- ✅ Test coverage
- ✅ Clear documentation

Awaiting Person 1 (backend) and Person 2 (frontend) to begin implementation.
