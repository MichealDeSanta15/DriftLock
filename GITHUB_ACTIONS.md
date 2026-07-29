# DriftLock GitHub Actions

Automated testing and deployment workflows for DriftLock.

## Overview

GitHub Actions automatically tests every push and pull request, ensuring code quality and preventing broken code from reaching main branch.

## Workflows

### 1. Test Workflow (test.yml)

**Triggers:**
- On push to: main, develop, feat/** branches
- On pull requests to: main, develop
- Filters: Only runs when backend/ or requirements.txt changes

**Jobs:**

#### Job: Test Backend
- **Runs on:** Ubuntu latest
- **Python version:** 3.11
- **Database:** PostgreSQL 15 (service container)

**Steps:**
1. Checkout code
2. Set up Python 3.11 with pip caching
3. Install dependencies from requirements.txt
4. Run pytest with coverage reporting
5. Upload coverage to Codecov (optional)

**Test Command:**
```bash
pytest backend/tests/ -v --cov=backend --cov-report=xml --cov-report=term-missing
```

**Coverage Reports:**
- XML format for Codecov
- Terminal output with missing lines highlighted
- Codecov integration (continues on error if not set up)

#### Job: Lint Code
- **Runs on:** Ubuntu latest
- **Python version:** 3.11

**Tools:**
- **flake8** — PEP 8 style enforcement
  - Critical errors (E9, F63, F7, F82) fail the job
  - All style issues reported but don't fail
  
- **mypy** — Static type checking
  - Ignores missing imports (for untyped packages)
  - Continues on error (informational)
  
- **black** — Code formatter
  - Checks if code matches black style
  - Continues on error (informational)

**Status:** All lint jobs use `continue-on-error: true` — failures reported but don't block merging

#### Job: Test Migrations
- **Runs on:** Ubuntu latest
- **Python version:** 3.11
- **Database:** PostgreSQL 15 (service container)

**Steps:**
1. Checkout code
2. Set up Python 3.11
3. Install dependencies
4. Run `alembic upgrade head` to test migrations
5. Verify migration state with `alembic current` and `alembic history`

**Purpose:** Ensures all migrations apply cleanly to a fresh database

### 2. Deploy Workflow (deploy.yml)

**Triggers:**
- On push to main branch only
- Filters: Only runs when backend/, Dockerfile, or docker-compose.yml changes

**Jobs:**

#### Job: Build Docker Image
- **Runs on:** Ubuntu latest
- **Uses:** Docker Buildx (multi-platform building)

**Steps:**
1. Checkout code
2. Set up Docker Buildx
3. Build Docker image
   - Tags: `driftlock-backend:SHA` and `driftlock-backend:latest`
   - Uses GitHub Actions cache (GHA) for layers
   - Does not push (stub for now)

**Purpose:** Verify Docker image builds without errors

#### Job: Test Build
- **Runs on:** Ubuntu latest
- **Depends on:** build job

**Steps:**
1. Checkout code
2. Set up Docker Buildx
3. Build Docker image for testing
   - Tag: `driftlock-backend:test`
   - Uses GitHub Actions cache

**Purpose:** Verify Docker image builds correctly

#### Job: Deploy (Commented Out - Stub)
Currently commented out. When ready to deploy:

```yaml
deploy:
  name: Deploy to Production
  runs-on: ubuntu-latest
  needs: [build, test-build]
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
```

**To implement:**
1. Add AWS credentials to GitHub Secrets
2. Uncomment the deploy job
3. Configure ECR (Elastic Container Registry)
4. Configure ECS (or other deployment target)
5. Add deployment steps

## Setup Instructions

### 1. Ensure requirements.txt Has Test Dependencies

The following must be in `requirements.txt`:

```
pytest==7.4.3
pytest-cov==4.1.0
pytest-asyncio==0.21.1
flake8==6.1.0
mypy==1.7.1
black==23.12.0
```

Already included in current `requirements.txt` ✅

### 2. Create Test Database Setup (Optional)

For better test performance, you can create a conftest.py:

```python
# backend/tests/conftest.py
import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models.base import Base

TEST_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://driftlock:test_password@localhost:5432/driftlock_test"
)

@pytest.fixture(scope="session")
def db_engine():
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)

@pytest.fixture
def db_session(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)()
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()
```

### 3. Configure Codecov (Optional)

To use Codecov for coverage tracking:

1. Go to https://codecov.io
2. Sign up with GitHub
3. Authorize for your repository
4. Repository will be auto-detected in workflow

Codecov is optional (workflow continues if not configured).

### 4. Set Up Branch Protection Rules (Optional)

Require tests to pass before merging:

1. Go to GitHub repository → Settings → Branches
2. Add rule for `main` branch
3. Require status checks to pass:
   - `Test Backend (Python 3.11)`
   - `Test Database Migrations`
4. Dismiss stale reviews when new commits are pushed
5. Require branches to be up to date

## Usage

### Manual Trigger

Workflows run automatically on push/PR. To manually trigger:

1. Go to repository → Actions
2. Select workflow (Test Backend or Build & Deploy)
3. Click "Run workflow"
4. Select branch
5. Click "Run workflow"

### View Results

1. Go to repository → Actions
2. Click on workflow run
3. Click on job to see details
4. Click on step to see output

### View Test Results

Each test run shows:
- Number of tests passed/failed
- Coverage percentage (if enabled)
- Coverage report (XML uploaded to Codecov)

### View Lint Results

Linting jobs show:
- flake8: Critical errors fail, style issues reported
- mypy: Type errors reported
- black: Format issues reported

## Workflow Details

### Service Containers

PostgreSQL 15 is started as a service container for test/migration jobs:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    env:
      POSTGRES_USER: driftlock
      POSTGRES_PASSWORD: test_password
      POSTGRES_DB: driftlock_test
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
    ports:
      - 5432:5432
```

Database is available at `localhost:5432` during job execution.

### Environment Variables

Available in workflow steps:

- `DATABASE_URL` — Set to test database for test jobs
- `GITHUB_SHA` — Current commit SHA
- `GITHUB_REF` — Current branch reference
- `GITHUB_REPOSITORY` — Repository name

### Caching

Python and Docker layers are cached using GitHub Actions cache:

**Python cache:**
```yaml
cache: 'pip'
```

**Docker cache:**
```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

Significantly speeds up subsequent runs.

## Status Badges

Add to README.md to show workflow status:

```markdown
![Tests](https://github.com/MichealDeSanta15/DriftLock/actions/workflows/test.yml/badge.svg)
![Build](https://github.com/MichealDeSanta15/DriftLock/actions/workflows/deploy.yml/badge.svg)
```

## Troubleshooting

### Tests Fail Locally but Pass in CI

**Common causes:**
- Different Python version locally vs CI (3.11 in CI)
- Missing test dependencies
- Database connectivity issues

**Solution:**
```bash
# Install all test dependencies
pip install -r requirements.txt

# Run tests locally with same environment
pytest backend/tests/ -v

# Check Python version
python --version  # Should be 3.11+
```

### Database Connection Fails in CI

**Cause:** Service container not healthy yet

**Solution:** Workflows already have proper health checks and waiting:
```yaml
options: >-
  --health-cmd pg_isready
  --health-interval 10s
  --health-timeout 5s
  --health-retries 5
```

### Coverage Not Uploading to Codecov

**Cause:** Codecov integration not set up (workflow continues on error)

**Solution:** 
1. Sign up at https://codecov.io
2. Connect GitHub account
3. Authorize for your repository
4. No additional setup needed — workflow auto-detects

### Docker Build Fails

**Check:**
1. Dockerfile is valid
2. requirements.txt exists and is valid
3. All files referenced in Dockerfile exist

**Debug:**
```bash
# Build locally
docker build -t driftlock-backend:test .

# Check for errors
docker image ls driftlock-backend
```

### Workflow Never Runs

**Check:**
1. Workflow file syntax is valid (YAML)
2. Trigger conditions are met (correct branch, file changes)
3. `.github/workflows/` directory exists
4. Workflow files have `.yml` extension

**Debug:**
1. Go to Actions tab
2. Look for workflow in list
3. Check "All workflows" if not visible
4. Click "Enable" if disabled

## Performance

### Typical Run Times

- **Test job:** 2-3 minutes (including setup)
- **Lint job:** 1-2 minutes
- **Migration job:** 1-2 minutes
- **Build job:** 2-5 minutes (depends on cache)

**Total:** ~5-10 minutes for full test.yml workflow

### Cost

GitHub Actions provides 2,000 free minutes per month for private repositories. DriftLock workflows:
- ~10 min per push to main
- ~10 min per PR
- **Typical usage:** ~200-500 min/month (within free tier)

## Configuration Options

### Run on More Branches

In test.yml, change `branches`:
```yaml
on:
  push:
    branches: [main, develop, 'feat/**', 'fix/**']
```

### Test on Multiple Python Versions

In test.yml strategy matrix:
```yaml
matrix:
  python-version: ["3.10", "3.11", "3.12"]
```

### Skip Workflow for Certain Commits

Add `[skip ci]` to commit message:
```bash
git commit -m "docs: update README [skip ci]"
```

### Require Workflow Success for Merge

1. Go to Settings → Branches
2. Add rule for main branch
3. Check "Require status checks to pass before merging"
4. Select which jobs must pass

## Next Steps

### Immediate
- ✅ Workflows set up and running
- ✅ Tests run on every push/PR
- ✅ Coverage tracked

### Soon
- Enable Codecov integration (optional)
- Set up branch protection rules (optional)
- Add workflow status badges to README

### Later
- Implement deployment job (post-MVP)
- Add security scanning (SAST)
- Add dependency scanning
- Add load testing workflows

## Files

| File | Purpose |
|------|---------|
| `.github/workflows/test.yml` | Test workflow |
| `.github/workflows/deploy.yml` | Build & deploy workflow |
| `GITHUB_ACTIONS.md` | This documentation |

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [pytest Documentation](https://docs.pytest.org/)
- [flake8 Documentation](https://flake8.pycqa.org/)
- [mypy Documentation](https://mypy.readthedocs.io/)
- [Docker Build Action](https://github.com/docker/build-push-action)

---

**Status:** ✅ GitHub Actions configured and ready
**Date:** 2026-07-29
**Next:** Enable branch protection rules, add Codecov integration (optional)
