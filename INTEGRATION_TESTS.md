# DriftLock Integration Tests

Complete guide to running and understanding integration tests for DriftLock.

## Overview

Integration tests verify that:
1. Database connection and schema are correct
2. Models and relationships work properly
3. Real-world scenarios execute correctly
4. Data integrity is maintained

## Running Tests

### Prerequisites

- Python 3.11+
- PostgreSQL 15 running (or set TEST_DATABASE_URL for other databases)
- Dependencies installed: `pip install -r requirements.txt`

### Run All Tests

```bash
pytest backend/tests/ -v
```

### Run Integration Tests Only

```bash
pytest backend/tests/integration_test.py -v
```

### Run Specific Test Class

```bash
pytest backend/tests/integration_test.py::TestDatabaseConnection -v
```

### Run Specific Test

```bash
pytest backend/tests/integration_test.py::TestModelOperations::test_create_site -v
```

### Run with Coverage

```bash
pytest backend/tests/integration_test.py -v --cov=backend --cov-report=html
```

### Run in Docker

```bash
docker-compose exec backend pytest backend/tests/integration_test.py -v
```

## Test Structure

Integration tests are organized into 4 test classes:

### 1. TestDatabaseConnection

Tests database connectivity, migrations, and schema.

**Tests:**
- `test_database_reachable` — Verify PostgreSQL is accessible
- `test_migrations_ran` — Verify all 5 tables exist
- `test_all_tables_have_columns` — Verify expected columns
- `test_indexes_exist` — Verify performance indexes created

**Purpose:** Ensures database setup is correct before other tests run.

**Run:**
```bash
pytest backend/tests/integration_test.py::TestDatabaseConnection -v
```

### 2. TestModelOperations

Tests individual model operations and relationships.

**Tests:**
- `test_create_site` — Create and verify a Site
- `test_create_selector` — Create and verify a Selector
- `test_site_selector_relationship` — Verify Site → Selector relationship
- `test_create_detection_event` — Create and verify DetectionEvent
- `test_create_repair_outcome` — Create and verify RepairOutcome
- `test_create_api_key` — Create and verify ApiKey

**Purpose:** Ensures each model can be created and retrieved correctly.

**Run:**
```bash
pytest backend/tests/integration_test.py::TestModelOperations -v
```

### 3. TestRealWorldScenario

Tests realistic end-to-end workflows.

**Tests:**
- `test_full_workflow_site_to_repair` — Complete workflow from Site creation through repair
  1. Create monitored website (Site)
  2. Add selectors to monitor
  3. Detect selector change
  4. Repair the selector
  5. Verify all data is linked correctly

- `test_multiple_sites_multiple_selectors` — Managing multiple sites with selectors
  1. Create 2 sites
  2. Create 3 selectors per site
  3. Verify structure

- `test_detection_to_repair_flow` — Detection signals trigger repairs
  1. Create site with selector
  2. Log multiple detection signals (hash_change, dom_diff, template_shift)
  3. Record multiple repair attempts
  4. Verify all are correctly linked

**Purpose:** Tests realistic usage patterns and data flow.

**Run:**
```bash
pytest backend/tests/integration_test.py::TestRealWorldScenario -v
```

### 4. TestDataIntegrity

Tests data integrity and cascade deletion.

**Tests:**
- `test_cascade_delete_selectors` — Removing Site deletes Selectors
- `test_cascade_delete_detection_events` — Removing Selector deletes DetectionEvents
- `test_cascade_delete_repair_outcomes` — Removing Selector deletes RepairOutcomes

**Purpose:** Ensures database constraints work correctly.

**Run:**
```bash
pytest backend/tests/integration_test.py::TestDataIntegrity -v
```

## Test Fixtures

### conftest.py

Provides shared test fixtures.

#### `test_engine` (session-scoped)

Single database engine for all tests in the session.

```python
@pytest.fixture(scope="session")
def test_engine():
    """Create test database engine."""
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
```

**Usage:**
```python
def test_something(test_engine):
    # Use test_engine to verify connections
    with test_engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
```

#### `db` (function-scoped)

Clean database session for each test. Changes are rolled back after the test.

```python
@pytest.fixture(scope="function")
def db(test_engine) -> Generator[Session, None, None]:
    """Provide clean database session for each test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)()
    yield session
    session.close()
    transaction.rollback()
    connection.close()
```

**Usage:**
```python
def test_create_site(db):
    site = Site(...)
    db.add(site)
    db.commit()
    
    # Verify
    retrieved = db.query(Site).first()
    assert retrieved is not None
```

**Benefits:**
- Each test starts with clean database
- Changes from one test don't affect others
- No cleanup needed between tests
- Transaction rollback is fast

#### `db_clean` (function-scoped)

Completely clean database for tests that need it.

```python
@pytest.fixture(scope="function")
def db_clean(test_engine):
    """Completely clean database for each test."""
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    # Cleanup
```

## Example Test

### Simple Test

```python
def test_create_site(db: Session):
    """Test creating a Site."""
    site = Site(
        id=generate_uuid(),
        name="Test Site",
        url="https://example.com",
        owner_id=generate_uuid(),
        is_active=True,
    )
    
    db.add(site)
    db.commit()
    
    # Verify
    retrieved = db.query(Site).filter_by(id=site.id).first()
    assert retrieved is not None
    assert retrieved.name == "Test Site"
```

### Complex Test with Relationships

```python
def test_full_workflow(db: Session):
    """Test complete workflow."""
    # Step 1: Create site
    site = Site(...)
    db.add(site)
    db.commit()
    
    # Step 2: Create selectors
    selector = Selector(site_id=site.id, ...)
    db.add(selector)
    db.commit()
    
    # Step 3: Create detection
    detection = DetectionEvent(selector_id=selector.id, ...)
    db.add(detection)
    db.commit()
    
    # Step 4: Create repair
    repair = RepairOutcome(selector_id=selector.id, ...)
    db.add(repair)
    db.commit()
    
    # Step 5: Verify all linked correctly
    retrieved_site = db.query(Site).first()
    assert len(retrieved_site.selectors) == 1
    assert len(retrieved_site.selectors[0].detection_events) == 1
    assert len(retrieved_site.selectors[0].repair_outcomes) == 1
```

## Database Configuration

### PostgreSQL (Recommended for Integration Tests)

Set environment variable:

```bash
export DATABASE_URL=postgresql://driftlock:driftlock_dev_password@localhost:5432/driftlock_test
```

Or use in .env:

```env
DATABASE_URL=postgresql://driftlock:driftlock_dev_password@localhost:5432/driftlock_test
```

### SQLite (Quick Testing)

For rapid local testing without PostgreSQL:

```bash
export TEST_DATABASE_URL=sqlite:///:memory:
pytest backend/tests/integration_test.py -v
```

**Note:** SQLite tests are faster but don't test PostgreSQL-specific features.

## Common Test Patterns

### Test Creation and Retrieval

```python
def test_create_and_retrieve(db):
    # Create
    obj = Model(...)
    db.add(obj)
    db.commit()
    obj_id = obj.id
    
    # Retrieve
    retrieved = db.query(Model).filter_by(id=obj_id).first()
    
    # Verify
    assert retrieved is not None
    assert retrieved.field == expected_value
```

### Test Relationships

```python
def test_relationship(db):
    # Create parent
    parent = ParentModel(...)
    db.add(parent)
    db.commit()
    
    # Create children
    child1 = ChildModel(parent_id=parent.id, ...)
    child2 = ChildModel(parent_id=parent.id, ...)
    db.add_all([child1, child2])
    db.commit()
    
    # Test relationship
    retrieved_parent = db.query(ParentModel).first()
    assert len(retrieved_parent.children) == 2
```

### Test Cascade Delete

```python
def test_cascade_delete(db):
    # Create parent and children
    parent = ParentModel(...)
    db.add(parent)
    db.commit()
    
    child = ChildModel(parent_id=parent.id, ...)
    db.add(child)
    db.commit()
    
    # Verify child exists
    assert db.query(ChildModel).filter_by(parent_id=parent.id).count() == 1
    
    # Delete parent
    db.delete(parent)
    db.commit()
    
    # Verify child is deleted (cascade)
    assert db.query(ChildModel).filter_by(parent_id=parent.id).count() == 0
```

### Test Updates

```python
def test_update(db):
    # Create
    obj = Model(field="old_value")
    db.add(obj)
    db.commit()
    obj_id = obj.id
    
    # Update
    retrieved = db.query(Model).filter_by(id=obj_id).first()
    retrieved.field = "new_value"
    db.commit()
    
    # Verify
    final = db.query(Model).filter_by(id=obj_id).first()
    assert final.field == "new_value"
```

## Debugging Tests

### View SQL Queries

Enable SQL echo:

```python
# In conftest.py
engine = create_engine(TEST_DATABASE_URL, echo=True)  # Shows all SQL
```

Or set environment:

```bash
export SQL_ECHO=true
pytest backend/tests/integration_test.py -v
```

### Print Debug Info

```python
def test_something(db):
    obj = Model(...)
    db.add(obj)
    db.commit()
    
    print(f"Created: {obj}")
    print(f"ID: {obj.id}")
    
    retrieved = db.query(Model).first()
    print(f"Retrieved: {retrieved}")
    print(f"Fields: {retrieved.__dict__}")
```

Run with output:

```bash
pytest backend/tests/integration_test.py -v -s
```

### Use pdb Debugger

```python
def test_something(db):
    obj = Model(...)
    db.add(obj)
    db.commit()
    
    import pdb; pdb.set_trace()  # Debugger stops here
```

Run and interact:

```bash
pytest backend/tests/integration_test.py -v -s
```

## Troubleshooting

### "No such table"

**Cause:** Migrations didn't run or database is wrong

**Solution:**
```bash
export DATABASE_URL=postgresql://...correct...
pytest backend/tests/integration_test.py -v
```

### "Connection refused"

**Cause:** PostgreSQL not running

**Solution:**
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Or verify it's running
psql -U driftlock -d driftlock_test
```

### "Authentication failed"

**Cause:** Wrong credentials in DATABASE_URL

**Solution:**
```bash
# Check .env or environment variable
echo $DATABASE_URL

# Should be:
# postgresql://driftlock:driftlock_dev_password@localhost:5432/driftlock_test
```

### Test Hangs

**Cause:** Transaction not committed or rolled back

**Solution:**
- Ensure `db.commit()` is called after modifications
- Fixtures handle rollback automatically
- Check for missing yields in fixtures

### Tests Pass Locally, Fail in CI

**Cause:** Different database configuration in CI

**Solution:**
- CI uses DATABASE_URL from environment
- Verify GitHub Actions sets correct DATABASE_URL
- Check service container health

## Performance

### Typical Test Run Times

| Test Class | Tests | Time |
|------------|-------|------|
| TestDatabaseConnection | 4 | ~1s |
| TestModelOperations | 6 | ~2s |
| TestRealWorldScenario | 3 | ~1s |
| TestDataIntegrity | 3 | ~1s |

**Total:** ~5-10 seconds for full integration test suite

## Continuous Integration

### GitHub Actions

Tests run automatically on every push/PR:

```yaml
# .github/workflows/test.yml
- name: Run pytest
  run: pytest backend/tests/ -v --cov=backend
```

Tests must pass before merging to main.

### Local Pre-Commit

Run tests before committing:

```bash
# Run full test suite
pytest backend/tests/ -v

# Run only integration tests
pytest backend/tests/integration_test.py -v
```

## Next Steps

### Add More Tests

As features are added:
1. Create test class for new feature
2. Test basic operations
3. Test relationships
4. Test error cases

### Add Async Tests

For async operations:

```python
@pytest.mark.asyncio
async def test_async_operation(db):
    # async test code
    pass
```

### Add Fixtures

Custom fixtures for your tests:

```python
@pytest.fixture
def sample_site(db):
    site = Site(...)
    db.add(site)
    db.commit()
    return site
```

## References

- [pytest Documentation](https://docs.pytest.org/)
- [SQLAlchemy Testing](https://docs.sqlalchemy.org/en/14/orm/session_basics.html)
- [Testing Async Code](https://pytest-asyncio.readthedocs.io/)

---

**Status:** ✅ Integration tests complete and passing
**Date:** 2026-07-29
**Coverage:** Database, Models, Relationships, Workflows
**Next:** Add more tests as features are developed
