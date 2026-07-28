# Database Migrations

This directory contains SQL migrations for the DriftLock backend.

## Migration Strategy

DriftLock uses Alembic for database version control. Migrations are auto-generated from the SQLAlchemy ORM models in `backend/models/selector.py`.

## Setup (Person 3)

### 1. Install Alembic
```bash
pip install alembic
```

### 2. Initialize Alembic (first time only)
```bash
alembic init migrations
```

This creates the Alembic environment and `alembic.ini`.

### 3. Generate Initial Migration

From the ORM models in `backend/models/selector.py`, generate the initial schema:

```bash
alembic revision --autogenerate -m "Initial schema: selectors, versions, change_logs"
```

This creates a migration file in `versions/` like `001_initial_schema.py`.

### 4. Review & Apply

Review the generated migration:
```bash
cat versions/001_initial_schema.py
```

Apply it to your database:
```bash
alembic upgrade head
```

## Schema Overview

The migrations will create three tables:

### `selectors`
- **id** (VARCHAR(64), PK): Unique selector identifier
- **site_id** (VARCHAR(64), indexed): Website the selector targets
- **selector_key** (VARCHAR(255)): Human-readable selector name
- **is_current** (BOOLEAN): Whether this is the active version
- **repair_count** (INTEGER): Number of times this selector was repaired
- **created_at** (TIMESTAMP TZ): Creation timestamp
- **updated_at** (TIMESTAMP TZ): Last update timestamp
- **Indexes**: `(site_id, is_current)`, `(selector_key)`

### `selector_versions`
- **id** (INTEGER, PK, auto): Auto-incrementing version ID
- **selector_id** (VARCHAR(64), FK → selectors): Links to parent selector
- **selector_value** (TEXT): The actual CSS/XPath selector string
- **version_number** (INTEGER): Sequential version within this selector
- **created_at** (TIMESTAMP TZ): When this version was created
- **is_backup** (BOOLEAN): True if this is a backup/fallback selector
- **confidence_score** (INTEGER, 0-100): Repair algorithm's confidence in this selector
- **Indexes**: `(selector_id, version_number)`, `(selector_id, created_at)`

### `change_logs`
- **id** (INTEGER, PK, auto): Auto-incrementing log entry ID
- **selector_id** (VARCHAR(64), FK → selectors): The affected selector
- **version_id** (INTEGER, FK → selector_versions): The new version after repair
- **old_selector** (TEXT): Previous selector value (null if first version)
- **new_selector** (TEXT): New selector value
- **detection_method** (VARCHAR(64)): How change was detected (e.g., "js_bundle_hash", "dom_diff")
- **repair_method** (VARCHAR(64)): Repair strategy used (e.g., "json_ld", "backup_key")
- **detection_timestamp** (TIMESTAMP TZ): When change was detected
- **repair_timestamp** (TIMESTAMP TZ): When repair was applied
- **repair_status** (VARCHAR(32)): "pending", "success", "failed", "partial"
- **validation_score** (INTEGER): 0-100 confidence in the repair
- **error_message** (TEXT): Error details if repair failed
- **Indexes**: `(selector_id, detection_timestamp)`, `(repair_status)`

## Environment Setup

Create a `.env` file in the project root with:
```
DATABASE_URL=postgresql://user:password@localhost:5432/driftlock
```

Then configure `alembic.ini` to read from this:
```python
# In alembic/env.py
from dotenv import load_dotenv
import os

load_dotenv()
database_url = os.getenv("DATABASE_URL")
```

## Future Migrations

As the ORM models change, generate new migrations:

```bash
alembic revision --autogenerate -m "Add new column X"
alembic upgrade head
```

Always review the generated migration file before applying!
