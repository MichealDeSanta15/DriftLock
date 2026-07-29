# DriftLock CI/CD Setup Guide

Complete guide to the GitHub Actions continuous integration pipeline.

## Overview

GitHub Actions automatically tests every push and pull request. Tests must pass before merging to main.

**Key Features:**
- Automated testing on push/PR
- PostgreSQL service container
- Database migrations verified
- Code quality checks
- Coverage tracking
- Results visible in GitHub UI

## Workflow Architecture

### Test Job

**Triggers:** Push to main/develop/feat/**, PR to main/develop

**Steps:**
1. Checkout code
2. Set up Python 3.11
3. Install dependencies
4. Wait for PostgreSQL (health check)
5. Run migrations (alembic upgrade head)
6. Run integration tests
7. Run all tests
8. Upload coverage

**Services:**
- PostgreSQL 15 with health checks

**Time:** ~5-10 minutes

### Lint Job

**Triggers:** Same as test job

**Steps:**
1. Checkout code
2. Set up Python 3.11
3. Install dependencies
4. Run flake8 (style)
5. Run mypy (type checking)
6. Run black (format)

**Status:** Issues reported but don't block merge

**Time:** ~1-2 minutes

### Migrations Job

**Triggers:** Same as test job

**Steps:**
1. Checkout code
2. Set up Python 3.11
3. Install dependencies
4. Wait for PostgreSQL
5. Run migrations
6. Verify migrations

**Purpose:** Ensures all migrations work cleanly

**Time:** ~1-2 minutes

## PostgreSQL Service Setup

### Configuration

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

### Health Check

Health check ensures PostgreSQL is ready before tests run:

```yaml
--health-cmd pg_isready      # Check if ready
--health-interval 10s        # Check every 10 seconds
--health-timeout 5s          # Timeout after 5 seconds
--health-retries 5           # Retry up to 5 times
```

### Connection Details

- **Host:** localhost
- **Port:** 5432
- **User:** driftlock
- **Password:** test_password
- **Database:** driftlock_test

### Connection String

```
postgresql://driftlock:test_password@localhost:5432/driftlock_test
```

Used in tests via `DATABASE_URL` environment variable.

## Test Execution Flow

### Step-by-Step

```
1. GitHub detects push/PR
   ↓
2. Workflow triggers (test.yml)
   ↓
3. Checkout code
   ↓
4. Set up Python 3.11
   ↓
5. Install requirements.txt
   ↓
6. Start PostgreSQL service
   ↓
7. Wait for PostgreSQL (pg_isready)
   ↓
8. Run migrations (alembic upgrade head)
   ↓
9. Run integration tests (pytest backend/tests/integration_test.py)
   ↓
10. Run all tests (pytest backend/tests/)
   ↓
11. Upload coverage (Codecov)
   ↓
12. Report results in GitHub UI
   ↓
13. Block merge if tests fail (if enabled)
```

### Test Database

Each test run uses a fresh PostgreSQL 15 database:

1. **Setup:** PostgreSQL container starts with driftlock_test database
2. **Migrations:** Alembic runs and creates all tables
3. **Tests:** pytest runs with clean database
4. **Teardown:** Database destroyed (container removed)

## Key Files

| File | Purpose |
|------|---------|
| `.github/workflows/test.yml` | Test job, migrations, code quality |
| `backend/alembic/` | Database migrations |
| `backend/tests/conftest.py` | pytest fixtures |
| `backend/tests/integration_test.py` | Integration tests |
| `requirements.txt` | Python dependencies |

## Environment Variables

### In GitHub Actions

Set via workflow file:

```yaml
env:
  DATABASE_URL: postgresql://driftlock:test_password@localhost:5432/driftlock_test
```

Available to all steps in job.

### Secrets (Optional)

For deployment (post-MVP):

1. Settings → Secrets and variables → Actions
2. Add secrets:
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY
   - etc.

Usage in workflow:

```yaml
- name: Deploy
  env:
    AWS_KEY: ${{ secrets.AWS_ACCESS_KEY_ID }}
  run: |
    # Deployment commands
```

## Running Locally Before Pushing

### Simulate CI Environment

```bash
# Set database URL
export DATABASE_URL=postgresql://driftlock:driftlock_dev_password@localhost:5432/driftlock_test

# Install dependencies
pip install -r requirements.txt

# Run migrations
cd backend
alembic upgrade head

# Run tests
pytest tests/ -v --tb=short --cov=backend
```

### Using Docker

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Set database URL
export DATABASE_URL=postgresql://driftlock:driftlock_dev_password@postgres:5432/driftlock_test

# Run in container
docker-compose exec backend pytest tests/ -v --tb=short
```

## Troubleshooting

### Tests Fail Locally but Pass in CI

**Cause:** Different environment setup

**Solution:**
- Match Python version (3.11)
- Match PostgreSQL version (15)
- Ensure dependencies match requirements.txt

### Tests Pass Locally but Fail in CI

**Cause:** PostgreSQL timing issue

**Solution:**
- CI health checks wait for PostgreSQL
- Local setup might not wait properly
- Make sure migrations run before tests

### "No such table" Error

**Cause:** Migrations didn't run

**Check:**
1. PostgreSQL started
2. Migrations ran successfully
3. DATABASE_URL is correct

**Fix in CI:**
```yaml
- name: Run migrations
  run: alembic upgrade head
```

### "Connection refused"

**Cause:** PostgreSQL not ready yet

**Check:** Health checks in workflow:
```yaml
--health-cmd pg_isready
--health-interval 10s
--health-retries 5
```

### "Authentication failed"

**Cause:** Wrong credentials

**Check:**
- User: driftlock
- Password: test_password
- Database: driftlock_test

**Fix:**
```yaml
POSTGRES_USER: driftlock
POSTGRES_PASSWORD: test_password
POSTGRES_DB: driftlock_test
```

### Slow Tests

**Cause:** PostgreSQL starting slowly

**Solution:**
- Increase health check retries
- Increase timeout values
- Use Alpine image (lighter)

### Tests Timeout

**Check:**
1. PostgreSQL health check status
2. Migrations not hanging
3. Tests not deadlocking

**Fix:**
```yaml
--health-timeout 10s    # Increase if needed
--health-retries 10     # More retries
```

## Performance Optimization

### Caching

pip cache enabled:
```yaml
cache: 'pip'
```

Speeds up dependency installation 2-3x on repeat runs.

### Parallel Execution

Jobs run in parallel:
- test job
- lint job
- migrations job

Total time = slowest job (~10 minutes)

### Matrix Testing

Can test multiple Python versions:

```yaml
strategy:
  matrix:
    python-version: ["3.10", "3.11", "3.12"]
```

Each version tests in parallel.

## Debugging

### View Logs

1. Go to repository → Actions
2. Click workflow run
3. Click job to expand
4. Click step to see output

### Enable Debugging

GitHub Actions provides debugging variables:

```yaml
- name: Enable debug logging
  run: |
    set -x  # Print commands
    echo $DATABASE_URL
    alembic current
```

### Print Environment

```yaml
- name: Debug info
  run: |
    echo "Python: $(python --version)"
    echo "PostgreSQL: $(psql --version)"
    echo "Environment: $(env | grep DATABASE)"
```

## Branch Protection

### Require Checks to Pass

1. Settings → Branches
2. Add rule for main
3. Check "Require status checks to pass"
4. Select jobs to require

Prevents merge if tests fail.

## Scheduled Tests (Future)

Can schedule tests at specific times:

```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
```

Useful for:
- Daily full test suite
- Performance benchmarks
- Extended integration tests

## CI/CD Best Practices

### ✅ DO

- Run tests on every push
- Require tests before merge
- Keep tests fast (< 15 minutes)
- Use service containers for databases
- Cache dependencies
- Report coverage
- Fail fast on critical errors

### ❌ DON'T

- Commit without testing
- Skip tests for "quick fixes"
- Push directly to main
- Use old Python versions
- Hardcode secrets in workflows
- Ignore failing tests
- Leave debug code in commits

## Monitoring

### GitHub Actions Dashboard

1. Repository → Actions
2. See all workflow runs
3. Filter by branch, status, etc.
4. View logs for failed runs

### Email Notifications

GitHub emails on:
- Workflow failure
- Workflow success (if enabled)

Configure in: Settings → Notifications

### Status Badges

Add to README.md:

```markdown
![Tests](https://github.com/MichealDeSanta15/DriftLock/actions/workflows/test.yml/badge.svg)
```

Shows workflow status on GitHub.

## Future Enhancements

### Deploy on Success

Uncomment deploy job in deploy.yml:
- Build Docker image
- Push to ECR (AWS)
- Deploy to ECS

### Security Scanning

Add SAST (Static Application Security Testing):
- CodeQL analysis
- Dependency scanning
- Secret scanning

### Performance Tests

Load testing on each push:
- API response time
- Database query performance
- Memory usage

### Documentation

Auto-generate docs on main push:
- API reference
- Test coverage report
- Performance benchmark results

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [pytest Documentation](https://docs.pytest.org/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)

---

**Status:** ✅ CI/CD configured and running
**Date:** 2026-07-29
**Tests:** Automated on every push/PR
**Coverage:** Database, models, integration
**Next:** Enable branch protection rules
