# DriftLock Database Schema

## Overview

PostgreSQL database with SQLAlchemy ORM models for DriftLock. All models use UUID primary keys and include `created_at`/`updated_at` timestamps.

## Setup

1. **Environment**: Set `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/driftlock_dev
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Initialize database**:
   ```bash
   python backend/init_db.py
   ```

## Models

### Site
Represents a tracked website.
- **Fields**: `id`, `owner_id`, `name`, `url`, `is_active`, `created_at`, `updated_at`
- **Indexes**: `(owner_id, is_active)` for fast customer lookups
- **Relationships**: `selectors`, `detection_events`

### Selector
CSS/XPath selector for a data extraction point. Tracks repair history and current status.
- **Fields**: `id`, `site_id`, `selector_key`, `old_selector`, `new_selector`, `repair_method`, `repair_status`, `is_current`, `repair_count`, `last_repaired_at`, `created_at`, `updated_at`
- **Repair Methods**: `backup_key`, `json_ld`, `reverse_search`, `manual`
- **Repair Status**: `pending`, `success`, `failed`
- **Indexes**: `(site_id, is_current)` for active selector lookup, `(selector_key)`
- **Relationships**: `site`, `repair_outcomes`, `detection_events`

### DetectionEvent
Logged when a website change is detected.
- **Fields**: `id`, `site_id`, `selector_id`, `signal_type`, `confidence`, `detection_details`, `detected_at`, `created_at`
- **Signal Types**: `hash_change`, `dom_diff`, `template_shift`, `content_change`
- **Confidence**: 0.0-1.0 score for change likelihood
- **Indexes**: `(site_id, detected_at)` for recent change queries, `(selector_id)`
- **Relationships**: `site`, `selector`

### RepairOutcome
Audit log of repair attempts and results.
- **Fields**: `id`, `selector_id`, `old_selector`, `new_selector`, `repair_method`, `status`, `failure_reason`, `validation_result`, `timestamp`, `created_at`
- **Status**: `success`, `failed`, `pending`
- **Repair Methods**: `backup_key`, `json_ld`, `reverse_search`, `manual`
- **Indexes**: `(selector_id, timestamp)`, `(status)` for outcome analysis
- **Relationships**: `selector`

### ApiKey
Customer API authentication keys (hashed, not plaintext).
- **Fields**: `id`, `owner_id`, `key_hash`, `name`, `is_revoked`, `last_used_at`, `created_at`, `updated_at`
- **Indexes**: `(key_hash)` for lookups, `(owner_id)` for customer keys
- **Relationships**: None (independent)

## Key Design Decisions

1. **UUID Primary Keys**: Database-agnostic, better for distributed systems
2. **Timestamps**: All models track creation and updates for audit trails
3. **Soft Delete Ready**: `is_active` flag on Site for deactivation without data loss
4. **Repair Audit Trail**: RepairOutcome captures every attempt for ML training
5. **Confidence Scoring**: DetectionEvent stores ML confidence (0-1) for threshold tuning
6. **Cascading Deletes**: Selector and DetectionEvent cascade on Site deletion

## Testing

Run tests with pytest:
```bash
pytest backend/tests/test_models.py
```

Tests validate:
- Model creation and persistence
- Relationships and cascading
- Timestamp automation
- Index creation

## Next Steps (Person 1 & Person 2)

- **Person 1 (Backend)**: Add detection logic in `backend/detection/` and repair logic in `backend/repair/`
- **Person 2 (Frontend)**: Create API endpoints in `src/app/api/` that use these models via Supabase
- **Integration**: Use `get_db()` from `backend.models.base` for FastAPI dependency injection
