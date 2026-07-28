# DriftLock Architecture

## Overview

DriftLock is a web scraper resilience service with three tiers:

1. **Data Layer** (`backend/models/`) — PostgreSQL schema for selector versioning
2. **Detection & Repair** (`backend/detection/`, `backend/repair/`) — Logic to detect changes and repair selectors
3. **API Layer** (`src/app/api/`) — HTTP endpoints for triggering detection and retrieving selectors

## Data Layer (Implemented)

### Core Tables

**Selectors** — Main selector entity linked to a site
- Stores the current selector key and metadata
- Tracks repair count and whether it's the active version
- Indexed on `(site_id, is_current)` for fast current-selector lookups

**SelectorVersions** — Version history for a selector
- Each row is a snapshot of a selector value at a point in time
- Tracks confidence scores and backup flags
- Indexed on `(selector_id, version_number)` and `(selector_id, created_at)`

**ChangeLogs** — Audit trail of detections and repairs
- Records what was detected, when, and how it was repaired
- Tracks repair status: pending, success, failed, partial
- Stores validation scores and error messages
- Indexed on `(selector_id, detection_timestamp)` and `(repair_status)`

### Relationships

```
Selector (1) ──→ (Many) SelectorVersions
Selector (1) ──→ (Many) ChangeLogs
SelectorVersion (1) ──→ (Many) ChangeLogs
```

### Why This Structure?

- **Version history**: Sites redesign multiple times; we keep all old selectors for pattern learning
- **Change logs**: Enables auditing (what broke when), debugging (what repair method worked), and learning (which sites redesign frequently)
- **Backup selectors**: If the primary selector fails, we can try a backup (JSON-LD, reverse-search fallback, etc.)
- **Timestamps + confidence**: Lets us distinguish real failures from transient blips and build confidence over time

## Detection & Repair (Not Yet Implemented)

### Detection (`backend/detection/site_monitor.py`)
- Monitor site changes via:
  - JS bundle hash changes (cheap, detects deployments)
  - DOM diffs (structure changes)
  - Template shifts (CSS class name changes)
- Signals: `detected=bool`, timestamp

### Repair (`backend/repair/selector_repair.py`)
- Given an old selector and a live site, find the new one:
  - Try backup selectors
  - JSON-LD fallback (structured data)
  - Reverse-search (find the element by nearby text)
- Output: new selector value, confidence score, repair method used

## API Layer (Not Yet Implemented)

### `POST /api/sites/detect`
- Input: `{siteUrl, selectorIds}`
- Output: `{detected: bool, repaired: [{selectorId, oldSelector, newSelector}]}`

### `GET /api/selectors/[selectorId]/current`
- Input: selector ID
- Output: `{selectorId, currentSelector, timestamp, lastRepaired}`

## Development Flow

1. **Data Layer** (Person 1) ✓
   - Define ORM models
   - Write tests for model relationships
   - Provide migration guidance for Person 3

2. **Migrations** (Person 3)
   - Use Alembic to generate SQL from the ORM
   - Review generated migrations
   - Apply to PostgreSQL

3. **Detection & Repair** (Person 1)
   - Implement in Phase 2
   - Tests on 2+ real sites

4. **API** (Person 2)
   - Wire detection/repair into endpoints
   - Tests

5. **Demo**
   - Connect scraper → trigger detection → verify repair works

## Testing Strategy

- **Model tests** (`backend/tests/test_selector_models.py`): Relationships, cascades, indexes
- **Integration tests** (`__tests__/`): Detection + repair + API end-to-end
- **Real-world tests**: Always test with 2+ live sites before shipping

## Database Setup

```bash
# 1. Create .env from .env.example
cp .env.example .env
# Edit DATABASE_URL with your PostgreSQL credentials

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run migrations
cd backend
alembic upgrade head

# 4. Verify schema
psql your_database -c "\dt"
```

## Key Design Decisions

- **SQLAlchemy ORM**: Provides clean models, automatic SQL generation, and testability
- **PostgreSQL**: Strong ACID guarantees, excellent JSON support (for future), good for real-time queries
- **Soft deletes**: Selectors marked `is_current=False` rather than deleted, enabling pattern learning
- **Version numbers**: Sequential per selector, not global, for easier migrations and incremental rebuilds
- **Confidence scores**: Repair algorithm's confidence in a selector (0-100), lets us rank fallbacks
- **Backup selectors**: Multiple CSS paths per selector, tried in order on repair
