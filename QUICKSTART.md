# DriftLock Quick Start Guide

Get the entire development environment running in 30 seconds with Docker, or 5 minutes manually.

## ⚡ Fastest Option: Docker (Recommended)

For the quickest setup, use Docker Compose:

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Setup (One Command)

```bash
./backend/docker_up.sh
```

✅ Everything starts automatically:
- PostgreSQL database
- Python backend
- Database migrations
- Live reload

**Backend is ready at:** http://localhost:8000

See `DOCKER_SETUP.md` for detailed Docker guide.

---

## Manual Setup (Local PostgreSQL)

If you prefer not to use Docker, set up locally.

### Prerequisites

- PostgreSQL 12+ installed and running
- Python 3.10+
- Terminal/Command line access

## Setup (First Time Only)

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Edit `.env` with Your Database Credentials

```env
# Replace with your PostgreSQL connection
DATABASE_URL=postgresql://user:password@localhost:5432/driftlock_dev
```

### 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 4. Initialize Database

```bash
python backend/init_db.py
```

**Expected Output:**
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

✅ **Database is now ready!**

## Verify Installation

### Check Migration Status

```bash
cd backend && alembic current
```

Expected output: `001`

### List All Migrations

```bash
cd backend && alembic history
```

### Run Tests

```bash
pytest backend/tests/test_models.py -v
pytest backend/tests/test_migrations.py -v
```

All tests should pass ✅

## Common Commands

### Check What's in the Database

```bash
# Connect to PostgreSQL
psql postgresql://user:password@localhost:5432/driftlock_dev

# List tables
\d

# Describe a table
\d sites

# See indexes
\di

# Quit
\q
```

### Run Migrations (After Schema Changes)

```bash
# Check what needs to be run
cd backend && alembic current

# Apply all pending migrations
cd backend && alembic upgrade head
```

### Rollback a Migration

```bash
# Go back one step
cd backend && alembic downgrade -1

# Go back to a specific migration
cd backend && alembic downgrade 001
```

### Reset Database (Development Only)

```bash
# This deletes all data and rebuilds from migrations
python backend/reset_db.py
```

You'll be prompted for confirmation:
```
⚠️  RESETTING DATABASE
Database: postgresql://...

This will:
  1. Drop all tables and data
  2. Reset migration history
  3. Rebuild schema from migrations

Continue? (yes/no): yes
```

## Viewing the Schema

### See SQL Schema

```bash
cat backend/schema.sql
```

### See Model Documentation

```bash
cat DATABASE.md
```

### See Migration Details

```bash
cat backend/alembic/versions/001_initial_schema.py
```

## Database Structure at a Glance

```
sites (customer websites)
├── id (UUID)
├── owner_id (customer ID)
├── name, url, is_active
└── has many: selectors, detection_events

selectors (CSS/XPath selectors)
├── id (UUID)
├── site_id → sites
├── selector_key, new_selector, old_selector
├── repair_method, repair_status, repair_count
└── has many: detection_events, repair_outcomes

detection_events (change detection logs)
├── id (UUID)
├── site_id → sites
├── selector_id → selectors
├── signal_type (hash_change, dom_diff, template_shift, content_change)
└── confidence (0.0-1.0 score)

repair_outcomes (repair audit trail)
├── id (UUID)
├── selector_id → selectors
├── old_selector, new_selector
├── repair_method, status (success/failed)
└── failure_reason

api_keys (authentication)
├── id (UUID)
├── owner_id (customer ID)
├── key_hash (hashed API key, not plaintext)
├── is_revoked, last_used_at
```

## Next Steps

### For Person 1 (Backend Development)

Database is ready. Start building:

1. Create FastAPI application
2. Create API routes in `src/app/api/`
3. Import models: `from backend.models import Site, Selector, ...`
4. Use database: `from backend.models.base import get_db`

Example:
```python
from fastapi import Depends
from backend.models import Site
from backend.models.base import get_db

@app.get("/sites/{site_id}")
async def get_site(site_id: str, db = Depends(get_db)):
    site = db.query(Site).filter_by(id=site_id).first()
    return site
```

### For Person 2 (Frontend Development)

Database schema is stable. Start building:

1. Create Next.js pages in `src/app/`
2. Build React components in `src/components/`
3. Call Person 1's API endpoints
4. No database access needed—go through Person 1's backend

### For Deployment

One command to deploy anywhere:

```bash
# On staging or production server
python backend/init_db.py  # First time only
cd backend && alembic upgrade head  # For new migrations
```

## Troubleshooting

### "database connection failed"

**Problem**: Can't connect to PostgreSQL

**Solution**:
1. Verify PostgreSQL is running: `psql --version`
2. Check `DATABASE_URL` in `.env` is correct
3. Verify credentials and network access

### "alembic: command not found"

**Problem**: Alembic not installed

**Solution**:
```bash
pip install -r requirements.txt
```

### "target database is not up to date"

**Problem**: Migration history is out of sync

**Solution**:
```bash
cd backend
alembic current          # See what's deployed
alembic upgrade head     # Apply all pending migrations
```

### "could not execute statement"

**Problem**: Migration has an error

**Solution**:
1. Read the error message carefully
2. Check the migration file: `backend/alembic/versions/`
3. If you wrote it, fix it and retry
4. Ask for help if it's a pre-written migration

### "Can I reset the database?"

Yes! Safe in development/testing:

```bash
python backend/reset_db.py
```

⚠️ **WARNING**: This deletes all data. Don't use in production.

## Files to Know

| File | Purpose |
|------|---------|
| `.env` | Your database credentials (never commit) |
| `requirements.txt` | Python dependencies |
| `backend/models/` | SQLAlchemy ORM models |
| `backend/alembic/` | Database migrations |
| `backend/init_db.py` | Initialize database |
| `backend/reset_db.py` | Reset database (dev only) |
| `backend/schema.sql` | SQL schema reference |
| `DATABASE.md` | Model documentation |
| `MIGRATIONS.md` | Migration guide |
| `PROJECT_STRUCTURE.md` | Project layout |

## Cheat Sheet

```bash
# Setup
cp .env.example .env
pip install -r requirements.txt
python backend/init_db.py

# Check status
cd backend && alembic current
cd backend && alembic history

# Test
pytest backend/tests/ -v

# Rollback
cd backend && alembic downgrade -1

# Reset (dev only)
python backend/reset_db.py

# View schema
cat backend/schema.sql
```

## Further Reading

- **DATABASE.md** — Full model documentation
- **MIGRATIONS.md** — Complete migration guide
- **PROJECT_STRUCTURE.md** — Project organization
- **PHASE1_SUMMARY.md** — Phase 1 details
- **PHASE2_SUMMARY.md** — Phase 2 details

---

✅ **All set!** Database is ready for development.

Next: Person 1 builds the backend API, Person 2 builds the frontend.
