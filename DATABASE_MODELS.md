# DriftLock Database Models

Complete documentation of the PostgreSQL database schema for DriftLock, built with SQLAlchemy ORM.

## Overview

The database foundation consists of 6 core models organized around website monitoring, selector management, and repair operations:

- **Site** — Monitored websites
- **Selector** — CSS/XPath selectors targeting page elements
- **DetectionEvent** — Logs of detected selector changes
- **RepairOutcome** — History of repair attempts
- **ApiKey** — Customer authentication
- **Base** — SQLAlchemy configuration

## Models

### Site

Represents a website being monitored by DriftLock.

**Table:** `sites`

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `id` | String(36) | PK, DEFAULT UUID | Unique identifier |
| `name` | String(255) | NOT NULL | Human-readable site name |
| `url` | String(2048) | NOT NULL | Website URL |
| `owner_id` | String(36) | NOT NULL, INDEX | Customer/owner identifier |
| `is_active` | Boolean | DEFAULT true | Active monitoring flag |
| `created_at` | DateTime | DEFAULT UTC, NOT NULL | Creation timestamp |
| `updated_at` | DateTime | DEFAULT UTC, NOT NULL | Last update timestamp |

**Indexes:**
- `idx_owner_is_active` (owner_id, is_active) — Find active sites for a customer

**Relationships:**
- `selectors` → Selector (cascade delete)
- `detection_events` → DetectionEvent (cascade delete)

---

### Selector

Represents a CSS/XPath selector targeting data on a website. Tracks selector evolution through site redesigns.

**Table:** `selectors`

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `id` | String(36) | PK, DEFAULT UUID | Unique identifier |
| `site_id` | String(36) | FK(sites.id), INDEX | Parent website |
| `selector_key` | String(255) | NOT NULL | CSS/XPath selector string |
| `is_current` | Boolean | DEFAULT true | Active selector flag |
| `repair_count` | Integer | DEFAULT 0 | Number of repairs applied |
| `last_repaired_at` | DateTime | Nullable | Timestamp of last successful repair |
| `old_selector` | Text | Nullable | Previous selector value |
| `new_selector` | Text | Nullable | Current selector value |
| `repair_method` | String(64) | Nullable | How selector was repaired |
| `repair_status` | String(32) | DEFAULT 'pending' | pending/success/failed |
| `created_at` | DateTime | DEFAULT UTC, NOT NULL | Creation timestamp |
| `updated_at` | DateTime | DEFAULT UTC, NOT NULL | Last update timestamp |

**Indexes:**
- `idx_site_is_current` (site_id, is_current) — Find current selectors for a site
- `idx_selector_key` (selector_key) — Search selectors by key

**Relationships:**
- `site` → Site
- `detection_events` → DetectionEvent (cascade delete)
- `repair_outcomes` → RepairOutcome (cascade delete)

---

### DetectionEvent

Logs when a selector change is detected on a website.

**Table:** `detection_events`

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `id` | String(36) | PK, DEFAULT UUID | Unique identifier |
| `site_id` | String(36) | FK(sites.id), INDEX | Parent website |
| `selector_id` | String(36) | FK(selectors.id), Nullable | Associated selector (if known) |
| `detected_at` | DateTime | DEFAULT UTC, NOT NULL | When detection occurred |
| `signal_type` | String(64) | NOT NULL | Detection method: hash_change, dom_diff, template_shift |
| `confidence` | Integer | DEFAULT 0 | 0-100 confidence score |
| `created_at` | DateTime | DEFAULT UTC, NOT NULL | Record creation time |
| `updated_at` | DateTime | DEFAULT UTC, NOT NULL | Last update timestamp |

**Indexes:**
- `idx_site_detected_at` (site_id, detected_at) — Find detections for a site in time range

**Relationships:**
- `site` → Site
- `selector` → Selector

---

### RepairOutcome

Records the result of each selector repair attempt.

**Table:** `repair_outcomes`

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `id` | String(36) | PK, DEFAULT UUID | Unique identifier |
| `selector_id` | String(36) | FK(selectors.id), INDEX | Repaired selector |
| `old_selector` | Text | NOT NULL | Original/broken selector |
| `new_selector` | Text | NOT NULL | Proposed/tested selector |
| `repair_method` | String(64) | NOT NULL | Method used: backup_selector, json_ld, reverse_search, etc. |
| `status` | String(32) | NOT NULL | success/failed/pending |
| `timestamp` | DateTime | DEFAULT UTC, NOT NULL | When repair occurred |
| `confidence` | Integer | Nullable | 0-100 confidence in repair |
| `error_message` | Text | Nullable | If failed, why |
| `created_at` | DateTime | DEFAULT UTC, NOT NULL | Record creation time |
| `updated_at` | DateTime | DEFAULT UTC, NOT NULL | Last update timestamp |

**Indexes:**
- `idx_selector_timestamp` (selector_id, timestamp) — Find repairs for a selector in time range
- `idx_repair_status` (status) — Find all repairs by status

**Relationships:**
- `selector` → Selector

---

### ApiKey

Stores hashed API keys for customer authentication.

**Table:** `api_keys`

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `id` | String(36) | PK, DEFAULT UUID | Unique identifier |
| `owner_id` | String(36) | NOT NULL, INDEX | API key owner |
| `key_hash` | String(64) | NOT NULL, UNIQUE | SHA256 hash of API key |
| `is_revoked` | Boolean | DEFAULT false | Revocation flag |
| `last_used_at` | DateTime | Nullable | Last authentication timestamp |
| `created_at` | DateTime | DEFAULT UTC, NOT NULL | Key creation time |
| `updated_at` | DateTime | DEFAULT UTC, NOT NULL | Last update timestamp |

**Indexes:**
- `idx_key_hash` (key_hash) — Fast lookup by key hash

**Relationships:**
- None (authentication table)

---

## Relationships Diagram

```
Site (1) ──┬──> (N) Selector
           │
           └──> (N) DetectionEvent

Selector (1) ──┬──> (N) DetectionEvent
               │
               └──> (N) RepairOutcome

ApiKey (N) ──> (1) Customer/Owner
```

## Usage Examples

### Create a new site

```python
from backend.models import Site, generate_uuid

site = Site(
    id=generate_uuid(),
    name="Acme Corp",
    url="https://acme.com",
    owner_id="customer-123",
    is_active=True
)
session.add(site)
session.commit()
```

### Add a selector to a site

```python
from backend.models import Selector, generate_uuid

selector = Selector(
    id=generate_uuid(),
    site_id=site.id,
    selector_key=".product-price",
    is_current=True,
    repair_count=0
)
session.add(selector)
session.commit()
```

### Log a detection event

```python
from backend.models import DetectionEvent, generate_uuid

detection = DetectionEvent(
    id=generate_uuid(),
    site_id=site.id,
    selector_id=selector.id,
    signal_type="hash_change",
    confidence=85
)
session.add(detection)
session.commit()
```

### Record a repair attempt

```python
from backend.models import RepairOutcome, generate_uuid

repair = RepairOutcome(
    id=generate_uuid(),
    selector_id=selector.id,
    old_selector=".product-price",
    new_selector=".price-tag",
    repair_method="backup_selector",
    status="success",
    confidence=92
)
session.add(repair)
session.commit()
```

### Query examples

```python
# Get all active sites for a customer
active_sites = session.query(Site).filter(
    (Site.owner_id == "customer-123") & (Site.is_active == True)
).all()

# Find current selectors for a site
current_selectors = session.query(Selector).filter(
    (Selector.site_id == site.id) & (Selector.is_current == True)
).all()

# Get detection history for a site (last 7 days)
from datetime import datetime, timedelta, timezone
week_ago = datetime.now(timezone.utc) - timedelta(days=7)
recent_detections = session.query(DetectionEvent).filter(
    (DetectionEvent.site_id == site.id) &
    (DetectionEvent.detected_at >= week_ago)
).order_by(DetectionEvent.detected_at.desc()).all()

# Find failed repairs that need investigation
failed_repairs = session.query(RepairOutcome).filter(
    RepairOutcome.status == "failed"
).order_by(RepairOutcome.timestamp.desc()).all()
```

## Initialization

### Set up database

1. Configure `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/driftlock
   ```

2. Create tables:
   ```bash
   python backend/init_models.py init
   ```

3. (Optional) Load demo data:
   ```bash
   python backend/init_models.py demo
   ```

### Drop tables (development only)

```bash
python backend/init_models.py drop
```

## Notes

- All tables use `created_at` and `updated_at` timestamps with UTC timezone
- Primary keys are UUID strings for security and horizontal scaling
- Foreign key relationships use cascade delete to maintain consistency
- Indexes are designed for common query patterns (lookups by owner, site, timestamp)
- API keys are stored as hashes — never store plaintext keys
- The `repair_status` and `status` fields use string enums for flexibility during early development
