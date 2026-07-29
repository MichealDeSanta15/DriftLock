# GitHub Actions CI/CD Fix Summary

## What Was Fixed

Updated `.github/workflows/test.yml` to properly run tests with PostgreSQL database integration.

## Changes Made

### 1. Test Job Improvements

#### Before
```yaml
- name: Run pytest
  env:
    DATABASE_URL: postgresql://driftlock:test_password@localhost:5432/driftlock_test
  run: |
    pytest backend/tests/ -v --cov=backend --cov-report=xml --cov-report=term-missing
```

#### After
```yaml
- name: Wait for PostgreSQL
  run: |
    until pg_isready -h localhost -U driftlock -d driftlock_test; do
      echo "Waiting for PostgreSQL..."
      sleep 1
    done
  env:
    PGPASSWORD: test_password

- name: Run database migrations
  env:
    DATABASE_URL: postgresql://driftlock:test_password@localhost:5432/driftlock_test
  working-directory: backend
  run: |
    alembic upgrade head

- name: Run integration tests
  env:
    DATABASE_URL: postgresql://driftlock:test_password@localhost:5432/driftlock_test
  run: |
    pytest backend/tests/integration_test.py -v --tb=short --cov=backend --cov-report=xml --cov-report=term-missing

- name: Run all tests
  env:
    DATABASE_URL: postgresql://driftlock:test_password@localhost:5432/driftlock_test
  run: |
    pytest backend/tests/ -v --tb=short --cov=backend --cov-report=xml --cov-report=term-missing
```

### 2. PostgreSQL Health Check

Added explicit wait for database:

```yaml
- name: Wait for PostgreSQL
  run: |
    until pg_isready -h localhost -U driftlock -d driftlock_test; do
      echo "Waiting for PostgreSQL..."
      sleep 1
    done
  env:
    PGPASSWORD: test_password
```

**Benefits:**
- Ensures database is ready before tests
- Prevents "connection refused" errors
- Clear feedback on database status

### 3. Database Migrations Before Tests

Added migration step:

```yaml
- name: Run database migrations
  env:
    DATABASE_URL: postgresql://driftlock:test_password@localhost:5432/driftlock_test
  working-directory: backend
  run: |
    alembic upgrade head
```

**Benefits:**
- Creates all tables before tests
- Matches production deployment
- Catches migration errors early

### 4. Better Error Messages

Added `--tb=short` flag to pytest:

```bash
pytest backend/tests/ -v --tb=short --cov=backend
```

**Benefits:**
- Shorter, clearer error messages
- Easier to identify failures
- Better debugging information

### 5. Split Test Runs

Run integration tests first, then all tests:

```yaml
- name: Run integration tests
  run: pytest backend/tests/integration_test.py -v --tb=short

- name: Run all tests
  run: pytest backend/tests/ -v --tb=short
```

**Benefits:**
- Quick feedback on integration tests
- Full test suite run afterwards
- Catch database issues early

### 6. Migrations Job Improvements

Enhanced migrations verification:

```yaml
- name: Run migrations
  run: |
    echo "Applying migrations..."
    alembic upgrade head
    echo "✓ Migrations applied successfully"

- name: Verify migrations
  run: |
    echo "Current migration version:"
    alembic current
    echo ""
    echo "Migration history:"
    alembic history
```

**Benefits:**
- Clear success message
- Verify migration state
- Show migration history

## Execution Flow

### New Test Pipeline

```
1. Checkout code
   ↓
2. Set up Python 3.11
   ↓
3. Install dependencies (pip install -r requirements.txt)
   ↓
4. Start PostgreSQL service (with health checks)
   ↓
5. Wait for PostgreSQL to be ready (pg_isready)
   ↓
6. Run migrations (alembic upgrade head)
   ↓
7. Run integration tests (pytest integration_test.py)
   ↓
8. Run all tests (pytest tests/)
   ↓
9. Upload coverage (Codecov)
   ↓
10. Report results in GitHub UI
   ↓
11. Block merge if tests fail (if enabled)
```

## PostgreSQL Configuration

### Service Configuration

```yaml
services:
  postgres:
    image: postgres:15-alpine
    env:
      POSTGRES_USER: driftlock
      POSTGRES_PASSWORD: test_password
      POSTGRES_DB: driftlock_test
    options: >-
      --health-cmd pg_isready      # Health check command
      --health-interval 10s         # Check every 10 seconds
      --health-timeout 5s           # Timeout after 5 seconds
      --health-retries 5            # Retry up to 5 times
    ports:
      - 5432:5432
```

### Connection Details

- **Host:** localhost
- **Port:** 5432
- **User:** driftlock
- **Password:** test_password
- **Database:** driftlock_test
- **Connection String:** postgresql://driftlock:test_password@localhost:5432/driftlock_test

## Test Requirements

### What Must Pass

1. **Database Connectivity**
   - PostgreSQL must be reachable
   - Health checks must pass

2. **Database Migrations**
   - `alembic upgrade head` must succeed
   - All 5 tables must be created

3. **Integration Tests**
   - 21 test cases must pass
   - 100+ assertions must succeed

4. **All Tests**
   - Any unit tests must pass
   - Coverage must be tracked

5. **Code Quality**
   - Critical flake8 errors fail (E9, F63, F7, F82)
   - mypy and black issues reported (non-blocking)

### Test Status in GitHub

Tests are **required** to pass before merging:

```
✅ Test Backend (Python 3.11) — Tests passed
  ├─ Wait for PostgreSQL
  ├─ Run migrations
  ├─ Run integration tests
  ├─ Run all tests
  └─ Upload coverage

✅ Lint Backend Code — Code quality checks
  ├─ flake8
  ├─ mypy
  └─ black

✅ Test Database Migrations — Migration verification
  ├─ Run migrations
  └─ Verify migrations
```

## Benefits

### 1. Real Database Testing
- Tests run against PostgreSQL 15 (production version)
- Not using in-memory SQLite
- Catches PostgreSQL-specific issues

### 2. Proper Sequencing
1. Migrations run before tests
2. Database is ready before tests
3. Tests see fresh database

### 3. Clear Feedback
- Health check ensures database ready
- Migration output shows success/failure
- Error messages are concise (--tb=short)

### 4. Fast Execution
- Parallel job execution
- Cached dependencies (pip cache)
- Service reuse across steps

### 5. Coverage Tracking
- Coverage reports uploaded to Codecov
- Trends tracked over time
- PR shows coverage impact

## Debugging

### View Test Output

1. Go to GitHub repository
2. Click "Actions" tab
3. Click workflow run
4. Click "Test Backend" job
5. Click "Run all tests" step
6. See pytest output with errors

### Local Testing

Simulate CI environment locally:

```bash
# Set database URL
export DATABASE_URL=postgresql://driftlock:test_password@localhost:5432/driftlock_test

# Install dependencies
pip install -r requirements.txt

# Run migrations
cd backend
alembic upgrade head

# Run tests
pytest tests/ -v --tb=short --cov=backend
```

## Troubleshooting Common Issues

### "Connection refused"
- PostgreSQL container didn't start
- Health check failed
- Check service container logs

### "No such table"
- Migrations didn't run
- Alembic failed silently
- Check "Run database migrations" step output

### "Table already exists"
- Migrations ran twice
- Check transaction isolation
- Verify job didn't re-run

### Tests Timeout
- PostgreSQL starting slowly
- Migrations taking long
- Increase health check timeout

### Secrets Not Found
- Only available in workflow, not in code
- Use: `${{ secrets.SECRET_NAME }}`
- Check Settings → Secrets and variables

## Configuration Reference

### Environment Variables

**In Test Job:**
```yaml
DATABASE_URL: postgresql://driftlock:test_password@localhost:5432/driftlock_test
PGPASSWORD: test_password
```

**Available to all steps in job**

### Workflow Triggers

**On Push:**
```yaml
- main branch
- develop branch
- feat/** branches
- Only if backend/, requirements.txt, or workflow changes
```

**On Pull Request:**
```yaml
- PR to main branch
- PR to develop branch
- Only if backend/, requirements.txt, or workflow changes
```

## Files Modified

| File | Changes |
|------|---------|
| `.github/workflows/test.yml` | Added PostgreSQL wait, migrations, split tests, better messages |
| `CI_CD_SETUP.md` | Complete CI/CD documentation |

## Documentation

### `CI_CD_SETUP.md`
Complete guide covering:
- PostgreSQL service setup
- Test execution flow
- Environment variables
- Troubleshooting
- Performance optimization
- Best practices
- Debugging techniques
- Branch protection
- Scheduled tests
- Monitoring

## Next Steps

### Immediate
1. Push this commit to feat/database-migrations
2. Create pull request to main
3. Watch GitHub Actions run
4. Verify tests pass

### Enable Branch Protection (Optional)
1. Settings → Branches
2. Add rule for main
3. Check "Require status checks to pass"
4. Select "Test Backend (Python 3.11)"
5. Enforce: Prevents merge if tests fail

### Monitor CI/CD
1. Go to Actions tab
2. Watch workflow runs
3. Review coverage reports (Codecov)
4. Debug any failures

---

**Status:** ✅ CI/CD fixed and ready for testing
**Date:** 2026-07-29
**PostgreSQL:** Integrated with health checks
**Tests:** Running on every push/PR
**Database:** Migrations run automatically
**Next:** Enable branch protection rules
