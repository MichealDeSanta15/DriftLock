# DriftLock Docker Setup

Complete guide to running DriftLock with Docker Compose for local development.

## Overview

Docker Compose orchestrates two services for local development:

- **PostgreSQL 15** — Database server
- **Backend** — Python/FastAPI application server

All services are automatically configured and can start with a single command.

## Quick Start

### 1. Prerequisites

Install on your system:
- [Docker](https://docs.docker.com/get-docker/) (20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (1.29+)

**Verify installation:**

```bash
docker --version
docker-compose --version
```

### 2. Clone Repository and Set Up

```bash
git clone https://github.com/MichealDeSanta15/DriftLock.git
cd DriftLock
cp backend/.env.example backend/.env
```

**Edit `backend/.env` if needed** (defaults work for local development):

```env
DB_USER=driftlock
DB_PASSWORD=driftlock_dev_password
DB_NAME=driftlock
BACKEND_URL=http://localhost:8000
LOG_LEVEL=INFO
```

### 3. Start Services

```bash
./backend/docker_up.sh
```

This single command:
1. Builds the backend Docker image
2. Starts PostgreSQL 15
3. Waits for database to be ready
4. Runs database migrations (Alembic)
5. Starts the backend server with live reload
6. Creates persistent volume for database

### 4. Verify Services

Backend API should be available at: **http://localhost:8000**

PostgreSQL should be accessible on: **localhost:5432**

Example curl request:

```bash
curl http://localhost:8000/health
# Expected: 200 OK
```

### 5. View Logs

Watch all services:

```bash
./backend/docker_logs.sh
```

Watch just backend:

```bash
./backend/docker_logs.sh backend
```

Watch just database:

```bash
./backend/docker_logs.sh postgres
```

### 6. Stop Services

```bash
./backend/docker_down.sh
```

**To clean up everything** (volumes included):

```bash
docker-compose down -v
```

## Architecture

### Services

#### PostgreSQL Container

- **Image:** postgres:15-alpine
- **Container name:** driftlock-postgres
- **Port:** 5432 (localhost:5432)
- **Volume:** postgres_data (persistent storage)
- **Health check:** pg_isready every 10s
- **Credentials:** From .env (DB_USER, DB_PASSWORD)

#### Backend Container

- **Image:** Builds from Dockerfile
- **Container name:** driftlock-backend
- **Port:** 8000 (localhost:8000)
- **Volume:** ./backend (live reload)
- **Health check:** HTTP /health every 10s
- **Startup:** Runs migrations, then starts server
- **Command:** uvicorn with reload enabled

### Networking

- Network: `driftlock-network` (bridge driver)
- Services communicate via container names (e.g., postgres:5432)
- Host can access via localhost (e.g., localhost:5432)

### Volumes

- **postgres_data** — PostgreSQL data directory
  - Persists between container restarts
  - Docker-managed location on host

- **./backend** — Code directory (mount)
  - Enables live reload in development
  - Changes reflected immediately in container

## File Structure

```
DriftLock/
├── Dockerfile                 # Backend container definition
├── docker-compose.yml         # Service orchestration
├── .dockerignore              # Files excluded from build
├── backend/
│   ├── docker_up.sh          # Start services
│   ├── docker_down.sh        # Stop services
│   ├── docker_logs.sh        # View logs
│   ├── .env.example          # Configuration template
│   ├── requirements.txt       # Python dependencies
│   ├── alembic/              # Database migrations
│   ├── models/               # SQLAlchemy models
│   └── api.py                # FastAPI application
└── [other files]
```

## Common Tasks

### Access Backend Container Shell

```bash
docker-compose exec backend bash
```

### Access Database Shell

```bash
docker-compose exec postgres psql -U driftlock -d driftlock
```

Example queries:

```sql
-- List all tables
\dt

-- Check sites table
SELECT * FROM sites;

-- Count selectors
SELECT COUNT(*) FROM selectors;

-- Exit
\q
```

### Run Backend Tests

```bash
docker-compose exec backend pytest backend/tests/ -v
```

### Run Backend Linting

```bash
docker-compose exec backend flake8 backend/
docker-compose exec backend mypy backend/
```

### Check Service Health

```bash
docker-compose ps
```

Output shows:
- Container names
- Status (Up, Down, Exited)
- Port mappings
- Health status

### View Environment Variables

```bash
docker-compose exec backend env | grep -E "DATABASE|LOG_LEVEL|SQL_ECHO"
```

### Rebuild Container

If you modify Dockerfile or requirements.txt:

```bash
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Clean Up

Remove stopped containers and unused images:

```bash
docker system prune
```

Remove with volumes:

```bash
docker system prune -v
```

## Troubleshooting

### "Cannot connect to Docker daemon"

Docker daemon is not running.

**Solution:**
- Start Docker Desktop (Mac/Windows)
- Or start Docker service (Linux):
  ```bash
  sudo systemctl start docker
  ```

### "Port 5432 already in use"

Another PostgreSQL instance is using port 5432.

**Solutions:**

Option 1: Stop existing PostgreSQL
```bash
# macOS (Homebrew)
brew services stop postgresql

# Linux
sudo systemctl stop postgresql
```

Option 2: Use different port in docker-compose.yml
```yaml
postgres:
  ports:
    - "5433:5432"  # Map to 5433 instead
```

Then update DATABASE_URL:
```env
DATABASE_URL=postgresql://driftlock:...@localhost:5433/driftlock
```

### "Port 8000 already in use"

Another application is using port 8000.

**Solution:** Use different port in docker-compose.yml
```yaml
backend:
  ports:
    - "8001:8000"  # Map to 8001
```

### "Backend keeps restarting"

Check logs:
```bash
./backend/docker_logs.sh backend
```

Common causes:
- Database not ready yet (wait a moment)
- Missing dependencies (check requirements.txt)
- Syntax error in code (fix and it auto-reloads)

### "Database connection refused"

Backend can't connect to PostgreSQL.

**Solutions:**

1. Check PostgreSQL is running:
   ```bash
   docker-compose ps postgres
   ```

2. Check health:
   ```bash
   docker-compose exec postgres pg_isready -U driftlock
   ```

3. Check DATABASE_URL is correct:
   ```bash
   docker-compose exec backend echo $DATABASE_URL
   ```

4. Check network:
   ```bash
   docker-compose exec backend curl postgres:5432
   ```

### "Migrations failed to run"

Database connection issue or migration syntax error.

**Solution:**

1. View logs:
   ```bash
   ./backend/docker_logs.sh backend
   ```

2. Check database is ready:
   ```bash
   docker-compose logs postgres | tail -20
   ```

3. Manually run migrations:
   ```bash
   docker-compose exec backend python backend/init_db.py
   ```

### "Live reload not working"

Code changes not appearing in container.

**Solution:**

Check volume mount in docker-compose.yml:
```yaml
backend:
  volumes:
    - ./backend:/app/backend
```

If still not working, restart backend:
```bash
docker-compose restart backend
```

## Development Workflow

### Make Code Changes

Edit files normally in your editor. Changes are reflected immediately in the container (live reload).

```bash
# Example: Edit backend/api.py
# Changes appear immediately in running container
```

### Run Tests

```bash
docker-compose exec backend pytest backend/tests/ -v
```

### Run Linters/Type Check

```bash
docker-compose exec backend flake8 backend/
docker-compose exec backend mypy backend/
docker-compose exec backend black --check backend/
```

### Format Code

```bash
docker-compose exec backend black backend/
```

### Create New Migration

```bash
docker-compose exec backend alembic revision --autogenerate -m "describe_change"
docker-compose exec backend alembic upgrade head
```

### Add New Dependency

1. Add to requirements.txt
2. Rebuild and restart:
   ```bash
   docker-compose build --no-cache backend
   docker-compose up -d backend
   ```

### View Database

```bash
docker-compose exec postgres psql -U driftlock -d driftlock
```

## Production Considerations

**For production deployment:**

- Don't use docker-compose (use Kubernetes, ECS, etc.)
- Never commit .env with real credentials
- Use separate images for database and backend
- Add proper logging and monitoring
- Set up SSL/TLS certificates
- Use secrets management (AWS Secrets, Vault, etc.)
- Don't use `--reload` flag (for live reload)
- Set proper resource limits (memory, CPU)
- Use health checks for orchestration
- Implement proper backup strategy for database

See deployment documentation for production setup.

## Advanced Topics

### Custom Network

Containers communicate via service names:

```bash
# From backend container
curl postgres:5432  # Connect to PostgreSQL
curl http://postgres:5432  # Same, with protocol
```

### Volume Mounts vs Volumes

- **Named volumes** (`postgres_data`) — Managed by Docker
- **Bind mounts** (`./backend`) — Direct folder mount

### Resource Limits

Add to docker-compose.yml for production:

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 512M
      reservations:
        cpus: '0.5'
        memory: 256M
```

### Logging

View container logs in JSON format:

```bash
docker logs driftlock-backend --follow --tail 100
```

### Multi-Stage Builds

The Dockerfile uses a simple single-stage build. For production, consider multi-stage to reduce image size.

## References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Python Docker Hub](https://hub.docker.com/_/python)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/docker/)

---

**Status:** ✅ Docker setup complete and tested
**Date:** 2026-07-29
**Ready for:** Local development, team collaboration
