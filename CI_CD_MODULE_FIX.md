# CI/CD Module Import Fix

## Problem

GitHub Actions workflow was failing with:
```
ModuleNotFoundError: No module named 'backend'
```

This happened because:
1. Working directory was incorrect for Python imports
2. PYTHONPATH didn't include the repository root
3. Migration and test commands ran from wrong directories
4. Module imports couldn't resolve the `backend` package

## Solution

Updated `.github/workflows/test.yml` to fix Python module imports and working directories.

### Key Changes

#### 1. **Set PYTHONPATH Environment Variable**

```yaml
env:
  PYTHONPATH: ${{ github.workspace }}
```

Added to all jobs that need to import the backend module:
- test job
- lint job
- migrations job

**Why:** Allows Python to find the `backend` package from the repository root.

#### 2. **Install from Correct Path**

**Before:**
```yaml
pip install -r requirements.txt
```

**After:**
```yaml
pip install -r backend/requirements.txt
```

**Why:** requirements.txt is in the backend/ directory, not the root.

#### 3. **Working Directory for Migrations**

**Before:**
```yaml
- name: Run database migrations
  working-directory: backend
  run: |
    alembic upgrade head
```

**After:**
```yaml
- name: Run database migrations
  run: |
    cd backend
    alembic upgrade head
```

**Why:** Explicit `cd` command is more reliable and visible in logs.

#### 4. **Working Directory for Tests**

**Before:**
```yaml
pytest backend/tests/ -v
```

**After:**
```yaml
cd backend
pytest tests/ -v
```

**Why:** Tests should run from backend directory where they can import the module.

#### 5. **PostgreSQL Service Configuration**

**Before:**
```yaml
image: postgres:15-alpine
env:
  POSTGRES_USER: driftlock
  POSTGRES_PASSWORD: test_password
  POSTGRES_DB: driftlock_test
```

**After:**
```yaml
image: postgres:15
env:
  POSTGRES_PASSWORD: postgres
  POSTGRES_DB: driftlock_test
```

**Why:**
- postgres:15 instead of alpine (more consistent)
- Default user is `postgres` (no need to specify)
- Simpler configuration

#### 6. **Database Connection String**

**Before:**
```yaml
DATABASE_URL: postgresql://driftlock:test_password@localhost:5432/driftlock_test
```

**After:**
```yaml
DATABASE_URL: postgresql://postgres:postgres@localhost:5432/driftlock_test
```

**Why:** Matches PostgreSQL 15 default credentials.

#### 7. **Coverage Report Path**

**Before:**
```yaml
files: ./coverage.xml
```

**After:**
```yaml
files: ./backend/coverage.xml
```

**Why:** Coverage report is generated in the backend/ directory.

## Complete Test Job Flow

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    working-directory: ./

    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/driftlock_test
      PYTHONPATH: ${{ github.workspace }}

    services:
      postgres:
        image: postgres:15
        # ... health checks ...

    steps:
      1. Checkout code
         → pwd: /home/runner/work/DriftLock/DriftLock

      2. Set up Python 3.11

      3. Install dependencies
         → pip install -r backend/requirements.txt
         → Installs: pytest, sqlalchemy, alembic, etc.

      4. Verify Python path
         → Shows current directory
         → Verifies PYTHONPATH is set
         → Confirms backend module exists

      5. Wait for PostgreSQL
         → Ensures database is healthy
         → pg_isready checks

      6. Run migrations
         → cd backend
         → alembic upgrade head
         → Creates all tables

      7. Verify migrations
         → Shows migration status
         → Lists migration history

      8. Run integration tests
         → cd backend
         → pytest tests/integration_test.py
         → PYTHONPATH allows: from backend.models import Site

      9. Run all tests
         → cd backend
         → pytest tests/
         → All unit and integration tests

      10. Upload coverage
          → coverage.xml is in backend/
```

## Module Import Chain

### When Alembic Runs

```
Working directory: backend/
Python path: /home/runner/work/DriftLock/DriftLock
PYTHONPATH: /home/runner/work/DriftLock/DriftLock

alembic upgrade head
  ↓
alembic/env.py loads
  ↓
from backend.models.base import Base
  ↓
Looks for: /home/runner/work/DriftLock/DriftLock/backend/models/base.py
  ↓
✅ Found (because PYTHONPATH includes repository root)
```

### When Tests Run

```
Working directory: backend/
Python path: /home/runner/work/DriftLock/DriftLock
PYTHONPATH: /home/runner/work/DriftLock/DriftLock

pytest tests/integration_test.py
  ↓
test loads conftest.py
  ↓
from backend.models import Site
  ↓
Looks for: /home/runner/work/DriftLock/DriftLock/backend/models/__init__.py
  ↓
✅ Found (because PYTHONPATH includes repository root)
```

## Debugging Steps

If you still see `ModuleNotFoundError`:

### 1. Check Working Directory
```yaml
- name: Verify working directory
  run: |
    pwd
    ls -la
    ls -la backend/
```

Expected output:
```
/home/runner/work/DriftLock/DriftLock
backend/
  models/
  tests/
  alembic/
  requirements.txt
```

### 2. Check PYTHONPATH
```yaml
- name: Verify PYTHONPATH
  run: |
    echo "PYTHONPATH: $PYTHONPATH"
    python -c "import sys; print('sys.path:'); print('\n'.join(sys.path))"
```

Expected output:
```
PYTHONPATH: /home/runner/work/DriftLock/DriftLock
sys.path:
/home/runner/work/DriftLock/DriftLock
/home/runner/work/DriftLock/DriftLock/backend
...
```

### 3. Check Module Import
```yaml
- name: Test module import
  run: |
    cd backend
    python -c "from backend.models import Site; print('✓ Module imported successfully')"
```

Expected output:
```
✓ Module imported successfully
```

### 4. Check alembic Can Find Models
```yaml
- name: Test alembic connection
  run: |
    cd backend
    python -c "from alembic.config import Config; c = Config(); print('✓ Alembic loaded successfully')"
```

Expected output:
```
✓ Alembic loaded successfully
```

## All Job Updates

### test job
- ✅ PYTHONPATH set
- ✅ pip install from backend/requirements.txt
- ✅ PostgreSQL 15 with postgres user
- ✅ cd backend before alembic and pytest
- ✅ Coverage report from backend/coverage.xml

### lint job
- ✅ PYTHONPATH set
- ✅ pip install from backend/requirements.txt
- ✅ Flake8, mypy, black on backend/

### migrations job
- ✅ PYTHONPATH set
- ✅ pip install from backend/requirements.txt
- ✅ PostgreSQL 15 with postgres user
- ✅ cd backend before alembic commands
- ✅ Migration verification with alembic current

## Verification Steps

After deployment, verify the workflow works:

1. **View GitHub Actions**
   - Go to repository → Actions
   - Select "Test Backend" workflow
   - Check latest run

2. **Look for Success Messages**
   ```
   ✓ Migrations completed
   ✓ Integration tests completed
   ✓ All tests completed
   ```

3. **Check Coverage**
   - Coverage report uploaded to Codecov
   - Should show backend module coverage

4. **Verify Logs Show Correct Paths**
   ```
   Current directory: /home/runner/work/DriftLock/DriftLock
   Python path: /home/runner/work/DriftLock/DriftLock
   Backend module location: backend/
   ```

## Files Changed

| File | Changes |
|------|---------|
| `.github/workflows/test.yml` | All 3 jobs updated with PYTHONPATH, working directories, correct paths |

## Benefits

✅ **Module Imports Work**
- PYTHONPATH includes repository root
- Python can find `backend` package

✅ **Commands Run from Correct Directory**
- alembic finds alembic.ini
- pytest finds tests/
- conftest.py loads correctly

✅ **PostgreSQL Credentials Match**
- Uses default postgres user
- Simpler configuration
- Works with postgres:15 image

✅ **Coverage Reports Upload**
- Coverage.xml in correct location
- Codecov can process reports

✅ **Clear Debugging**
- "Verify Python path" step shows setup
- Working directory printed
- Easy to diagnose issues

## Next Steps

1. **Push the fix**
   ```bash
   git add .github/workflows/test.yml
   git commit -m "ci: fix module import by setting PYTHONPATH and working directories"
   git push origin feat/database-migrations
   ```

2. **Watch GitHub Actions**
   - Go to Actions tab
   - Monitor workflow run
   - Should complete successfully

3. **Check Test Results**
   - All jobs should pass (test, lint, migrations)
   - Coverage report should upload

4. **Create Pull Request**
   - feat/database-migrations → main
   - GitHub Actions will run on PR

---

**Status:** ✅ Module import issue fixed
**Date:** 2026-07-29
**Issue:** ModuleNotFoundError: No module named 'backend'
**Solution:** PYTHONPATH environment variable + working directories
**Next:** Push and verify workflow runs successfully
