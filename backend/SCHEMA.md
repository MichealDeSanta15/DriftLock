# DriftLock Database Schema

This document describes the expected PostgreSQL schema generated from the ORM models in `backend/models/selector.py`.

## Table: `selectors`

Primary table for selector definitions.

```sql
CREATE TABLE selectors (
    id VARCHAR(64) PRIMARY KEY,
    site_id VARCHAR(64) NOT NULL,
    selector_key VARCHAR(255) NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    repair_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_site_is_current ON selectors(site_id, is_current);
CREATE INDEX idx_selector_key ON selectors(selector_key);
```

### Columns

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | VARCHAR(64) | NO | — | Unique selector ID (e.g., "sel_product_title_1") |
| site_id | VARCHAR(64) | NO | — | Website this selector targets (e.g., "site_amazon_com") |
| selector_key | VARCHAR(255) | NO | — | Human-readable name (e.g., "product_title") |
| is_current | BOOLEAN | NO | TRUE | Is this the active version? |
| repair_count | INTEGER | NO | 0 | Number of times repaired |
| created_at | TIMESTAMP TZ | NO | NOW() | When created |
| updated_at | TIMESTAMP TZ | NO | NOW() | When last updated |

### Indexes

- `idx_site_is_current`: Fast lookups of current selectors for a site
- `idx_selector_key`: Search by selector name

---

## Table: `selector_versions`

Version history for each selector. Multiple rows per selector as it changes.

```sql
CREATE TABLE selector_versions (
    id SERIAL PRIMARY KEY,
    selector_id VARCHAR(64) NOT NULL REFERENCES selectors(id),
    selector_value TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_backup BOOLEAN NOT NULL DEFAULT FALSE,
    confidence_score INTEGER NOT NULL DEFAULT 100
);

CREATE INDEX idx_selector_version ON selector_versions(selector_id, version_number);
CREATE INDEX idx_selector_created ON selector_versions(selector_id, created_at);
```

### Columns

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | SERIAL | NO | — | Auto-incrementing version ID |
| selector_id | VARCHAR(64) | NO | — | Links to parent selector |
| selector_value | TEXT | NO | — | The actual CSS/XPath selector (e.g., "div.product-title") |
| version_number | INTEGER | NO | — | Sequential version (1, 2, 3, ...) |
| created_at | TIMESTAMP TZ | NO | NOW() | When this version was created |
| is_backup | BOOLEAN | NO | FALSE | Is this a fallback/backup selector? |
| confidence_score | INTEGER | NO | 100 | Repair algorithm confidence (0-100) |

### Relationships

- Foreign key: `selector_id` → `selectors.id` (cascade delete)

### Indexes

- `idx_selector_version`: Get version N of a selector
- `idx_selector_created`: Time-ordered versions for a selector

### Example Data

```
Selector: sel_product_title (site_amazon_com)
  Version 1: "div.product-title"              (confidence 100, not backup)
  Version 2: "h1[data-asin]"                  (confidence 95, is backup)
  Version 3: "div.a-price"                    (confidence 88, is backup - from JSON-LD)
```

---

## Table: `change_logs`

Audit trail of all detections and repair events.

```sql
CREATE TABLE change_logs (
    id SERIAL PRIMARY KEY,
    selector_id VARCHAR(64) NOT NULL REFERENCES selectors(id),
    version_id INTEGER REFERENCES selector_versions(id),
    old_selector TEXT,
    new_selector TEXT NOT NULL,
    detection_method VARCHAR(64),
    repair_method VARCHAR(64),
    detection_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    repair_timestamp TIMESTAMP WITH TIME ZONE,
    repair_status VARCHAR(32) NOT NULL DEFAULT 'pending',
    validation_score INTEGER,
    error_message TEXT
);

CREATE INDEX idx_selector_detection ON change_logs(selector_id, detection_timestamp);
CREATE INDEX idx_repair_status ON change_logs(repair_status);
```

### Columns

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | SERIAL | NO | — | Auto-incrementing log ID |
| selector_id | VARCHAR(64) | NO | — | The affected selector |
| version_id | INTEGER | YES | — | The new version created by this repair |
| old_selector | TEXT | YES | — | Previous value (NULL if first version) |
| new_selector | TEXT | NO | — | New/repaired value |
| detection_method | VARCHAR(64) | YES | — | How change was detected (e.g., "js_bundle_hash", "dom_diff") |
| repair_method | VARCHAR(64) | YES | — | Repair strategy (e.g., "backup_key", "json_ld", "reverse_search") |
| detection_timestamp | TIMESTAMP TZ | NO | NOW() | When change was detected |
| repair_timestamp | TIMESTAMP TZ | YES | — | When repair was applied |
| repair_status | VARCHAR(32) | NO | 'pending' | Status: pending, success, failed, partial |
| validation_score | INTEGER | YES | — | Confidence in repair (0-100) |
| error_message | TEXT | YES | — | Error details if repair failed |

### Relationships

- Foreign key: `selector_id` → `selectors.id` (cascade delete)
- Foreign key: `version_id` → `selector_versions.id` (optional)

### Indexes

- `idx_selector_detection`: Time-ordered repairs for a selector
- `idx_repair_status`: Find all pending or failed repairs

### Example Data

```
Log 1:
  selector_id: sel_product_title
  old_selector: "div.product-title"
  new_selector: "div.a-dynamic-title"
  detection_method: "dom_diff"
  repair_method: "backup_key"
  detection_timestamp: 2025-07-28T14:23:00Z
  repair_timestamp: 2025-07-28T14:23:45Z
  repair_status: "success"
  validation_score: 98

Log 2:
  selector_id: sel_price
  old_selector: "span.price"
  new_selector: NULL (failed)
  detection_method: "js_bundle_hash"
  repair_method: "reverse_search"
  detection_timestamp: 2025-07-28T15:10:00Z
  repair_timestamp: 2025-07-28T15:10:30Z
  repair_status: "failed"
  error_message: "No matching element found in 500 candidates"
```

---

## Summary: Key Constraints & Relationships

1. **Cascade Delete**: Deleting a selector cascades to all versions and logs
2. **No Orphans**: Every version and log must have a valid selector_id
3. **Optional version_id**: Not all logs create a new version (e.g., failed repairs)
4. **Repair Status Enum**: Expect values: pending, success, failed, partial
5. **Default Timestamps**: All timestamps default to NOW() (UTC)
6. **Confidence Scores**: Integer 0-100, default 100

---

## Migration Commands (Person 3)

```bash
# Generate migration from ORM models
alembic revision --autogenerate -m "Initial schema: selectors, versions, change_logs"

# Review the generated file
cat versions/001_initial_schema.py

# Apply to database
alembic upgrade head

# Verify schema was created
psql driftlock -c "\dt"
psql driftlock -c "\di" | grep idx_
```

## Testing the Schema

After migrations are applied, verify with:

```sql
-- Check table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY indexname;

-- Check foreign keys
SELECT constraint_name, table_name, column_name 
FROM information_schema.key_column_usage 
WHERE table_schema = 'public' 
ORDER BY table_name, column_name;
```
