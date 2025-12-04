# Docker Setup - Containerized Deployment Guide

## Overview

The DeX Trading Agent uses **Docker and Docker Compose** for containerized deployment, providing isolated, reproducible environments across different machines. This guide covers the complete Docker setup, including multi-stage builds, service orchestration, volume management, networking, and production deployment.

**Deployment Model:** Local-only containerized deployment  
**Architecture:** Multi-container setup with frontend, backend, and Redis  
**Orchestration:** Docker Compose for service management

**Last Updated:** November 15, 2025  
**Maintained By:** VenTheZone

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Docker Services](#docker-services)
4. [Dockerfile Configuration](#dockerfile-configuration)
5. [Docker Compose Setup](#docker-compose-setup)
6. [Environment Variables](#environment-variables)
7. [Volume Management](#volume-management)
8. [Networking](#networking)
9. [Quick Start Guide](#quick-start-guide)
10. [Development vs Production](#development-vs-production)
11. [Health Checks](#health-checks)
12. [Troubleshooting](#troubleshooting)
13. [Performance Optimization](#performance-optimization)
14. [Security Considerations](#security-considerations)
15. [Maintenance & Updates](#maintenance--updates)

---

## 1. Architecture Overview

### Container Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Host (Local Machine)              │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              dex-network (Bridge)                   │    │
│  │                                                     │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │    │
│  │  │   Frontend   │  │   Backend    │  │  Redis  │ │    │
│  │  │  (React)     │  │  (FastAPI)   │  │ (Cache) │ │    │
│  │  │              │  │              │  │         │ │    │
│  │  │  Port: 3000  │  │  Port: 8000  │  │ Port:   │ │    │
│  │  │              │  │              │  │  6379   │ │    │
│  │  └──────┬───────┘  └──────┬───────┘  └────┬────┘ │    │
│  │         │                 │                │      │    │
│  │         └─────────────────┴────────────────┘      │    │
│  │                    Internal Network                │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Volumes:                                                    │
│  • backend-data (SQLite database persistence)                │
│  • redis-data (Redis persistence)                            │
└─────────────────────────────────────────────────────────────┘
```

### Service Dependencies

```
redis (starts first)
  ↓
backend (depends on redis)
  ↓
frontend (depends on backend)
```

---

## 2. Prerequisites

### Required Software

- **Docker Desktop** 20.10+ (includes Docker Engine and Docker Compose)
  - Download: https://www.docker.com/products/docker-desktop
  - Verify: `docker --version` and `docker-compose --version`

- **Git** (for cloning repository)
  - Verify: `git --version`

### System Requirements

- **CPU:** 2+ cores recommended
- **RAM:** 4GB minimum, 8GB recommended
- **Disk Space:** 5GB for images and volumes
- **OS:** Linux, macOS, or Windows 10/11 with WSL2

### Port Availability

Ensure these ports are free:
- `3000` - Frontend (React/Vite)
- `8000` - Backend (FastAPI)
- `6379` - Redis (internal, can be blocked externally)

---

## 3. Docker Services

### Service: Frontend (React/Vite)

**Container Name:** `dex-frontend`  
**Base Image:** `node:20-alpine`  
**Build Context:** `.` (project root)  
**Dockerfile:** `./Dockerfile`

**Purpose:**
- Serves the React frontend application
- Built with Vite for optimized production bundles
- Connects to backend API at `http://localhost:8000`

**Exposed Ports:**
- `3000:3000` (host:container)

**Dependencies:**
- Depends on `backend` service

---

### Service: Backend (FastAPI)

**Container Name:** `dex-backend`  
**Base Image:** `python:3.11-slim`  
**Build Context:** `./migration_python`  
**Dockerfile:** `./migration_python/Dockerfile`

**Purpose:**
- Runs FastAPI server for REST API and WebSocket
- Handles trading logic, AI analysis, and database operations
- Connects to Redis for background tasks

**Exposed Ports:**
- `8000:8000` (host:container)

**Dependencies:**
- Depends on `redis` service

**Volumes:**
- `backend-data:/app/data` (database persistence)
- `./migration_python:/app` (development hot-reload)

---

### Service: Redis

**Container Name:** `dex-redis`  
**Base Image:** `redis:7-alpine`  
**Purpose:** Message broker for Celery background tasks

**Exposed Ports:**
- `6379:6379` (host:container)

**Volumes:**
- `redis-data:/data` (persistence)

**Health Check:**
- Command: `redis-cli ping`
- Interval: 10 seconds
- Timeout: 5 seconds
- Retries: 5

---

## 4. Dockerfile Configuration

### Frontend Dockerfile

**Location:** `./Dockerfile`

**Multi-Stage Build:**

```dockerfile
# Stage 1: Builder
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install vite for preview command
RUN pnpm add -D vite

# Copy built application from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Start the application
CMD ["pnpm", "preview", "--host", "0.0.0.0"]
```

**Optimization Features:**
- Multi-stage build reduces final image size
- Frozen lockfile ensures reproducible builds
- Alpine Linux base for minimal footprint
- Layer caching for faster rebuilds

---

### Backend Dockerfile

**Location:** `./migration_python/Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Key Features:**
- Python 3.11 for performance and type hints
- System dependencies for PostgreSQL (future support)
- Health check for container monitoring
- Uvicorn ASGI server for async support

---

## 5. Docker Compose Setup

### Production Configuration

**File:** `docker-compose.yml`

```yaml
services:
  # Python Backend (FastAPI)
  backend:
    build:
      context: ./migration_python
      dockerfile: Dockerfile
    container_name: dex-backend
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
      - HOST=0.0.0.0
      - PORT=8000
      - DATABASE_URL=sqlite:///./data/dex_trading.db
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY:-}
      - CRYPTOPANIC_AUTH_TOKEN=${CRYPTOPANIC_AUTH_TOKEN:-}
      - REDIS_URL=redis://redis:6379/0
    volumes:
      - backend-data:/app/data
      - ./migration_python:/app
    depends_on:
      - redis
    restart: unless-stopped
    networks:
      - dex-network
    healthcheck:
      test: ["CMD", "python", "-c", "import requests; requests.get('http://localhost:8000/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Redis for background tasks
  redis:
    image: redis:7-alpine
    container_name: dex-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped
    networks:
      - dex-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Frontend (React/Vite)
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: dex-frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_PYTHON_API_URL=http://localhost:8000
      - VITE_DOCKER_DEPLOYMENT=true
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - dex-network

volumes:
  backend-data:
    driver: local
  redis-data:
    driver: local

networks:
  dex-network:
    driver: bridge
```

---

## 6. Environment Variables

### Backend Environment Variables

**Required:**
- `OPENROUTER_API_KEY` - OpenRouter API key for AI analysis
- `DATABASE_URL` - SQLite database path (default: `sqlite:///./data/dex_trading.db`)

**Optional:**
- `CRYPTOPANIC_AUTH_TOKEN` - CryptoPanic news API token
- `REDIS_URL` - Redis connection URL (default: `redis://redis:6379/0`)
- `ENVIRONMENT` - Deployment environment (`production` or `development`)
- `HOST` - Server host (default: `0.0.0.0`)
- `PORT` - Server port (default: `8000`)

### Frontend Environment Variables

**Required:**
- `VITE_PYTHON_API_URL` - Backend API URL (default: `http://localhost:8000`)

**Optional:**
- `VITE_DOCKER_DEPLOYMENT` - Flag for Docker deployment (default: `true`)

### Setting Environment Variables

**Method 1: .env File (Recommended)**

Create `.env` in project root:

```bash
# Backend API Keys
OPENROUTER_API_KEY=sk-or-v1-your-key-here
CRYPTOPANIC_AUTH_TOKEN=your-token-here

# Database
DATABASE_URL=sqlite:///./data/dex_trading.db

# Redis
REDIS_URL=redis://redis:6379/0

# Frontend
VITE_PYTHON_API_URL=http://localhost:8000
```

**Method 2: Export in Shell**

```bash
export OPENROUTER_API_KEY="sk-or-v1-your-key-here"
export CRYPTOPANIC_AUTH_TOKEN="your-token-here"
```

**Method 3: Docker Compose Override**

Create `docker-compose.override.yml`:

```yaml
services:
  backend:
    environment:
      - OPENROUTER_API_KEY=sk-or-v1-your-key-here
      - CRYPTOPANIC_AUTH_TOKEN=your-token-here
```

---

## 7. Volume Management

### Backend Data Volume

**Name:** `backend-data`  
**Mount Point:** `/app/data` (inside container)  
**Purpose:** Persist SQLite database across container restarts

**Contents:**
- `dex_trading.db` - Main SQLite database
- Trading logs, balance history, position snapshots

**Backup:**
```bash
# Create backup
docker run --rm -v dex-trading-agent_backend-data:/data -v $(pwd):/backup alpine tar czf /backup/backend-data-backup.tar.gz -C /data .

# Restore backup
docker run --rm -v dex-trading-agent_backend-data:/data -v $(pwd):/backup alpine tar xzf /backup/backend-data-backup.tar.gz -C /data
```

---

### Redis Data Volume

**Name:** `redis-data`  
**Mount Point:** `/data` (inside container)  
**Purpose:** Persist Redis data (Celery task queue)

**Contents:**
- Redis RDB snapshots
- Background task queue state

**Clear Redis Cache:**
```bash
docker exec dex-redis redis-cli FLUSHALL
```

---

### Volume Commands

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect dex-trading-agent_backend-data

# Remove volume (WARNING: deletes data)
docker volume rm dex-trading-agent_backend-data

# Remove all unused volumes
docker volume prune
```

---

## 8. Networking

### Bridge Network

**Name:** `dex-network`  
**Driver:** `bridge`  
**Purpose:** Internal communication between containers

**Service DNS:**
- `frontend` → Accessible at `http://frontend:3000` (internal)
- `backend` → Accessible at `http://backend:8000` (internal)
- `redis` → Accessible at `redis://redis:6379` (internal)

**External Access:**
- Frontend: `http://localhost:3000` (host)
- Backend: `http://localhost:8000` (host)
- Redis: `redis://localhost:6379` (host)

### Network Isolation

- Containers communicate via internal DNS
- Only exposed ports are accessible from host
- No external internet access required (except for API calls)

---

## 9. Quick Start Guide

### Step 1: Clone Repository

```bash
git clone https://github.com/VenTheZone/dex-trading-agent.git
cd dex-trading-agent
```

### Step 2: Configure Environment

Create `.env` file:

```bash
cat > .env << EOF
OPENROUTER_API_KEY=sk-or-v1-your-key-here
CRYPTOPANIC_AUTH_TOKEN=your-token-here
DATABASE_URL=sqlite:///./data/dex_trading.db
REDIS_URL=redis://redis:6379/0
VITE_PYTHON_API_URL=http://localhost:8000
EOF
```

### Step 3: Build and Start

```bash
# Build images and start services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### Step 4: Verify Services

```bash
# Check running containers
docker-compose ps

# Check logs
docker-compose logs -f

# Test backend health
curl http://localhost:8000/health

# Test frontend
open http://localhost:3000
```

### Step 5: Stop Services

```bash
# Stop containers (preserves volumes)
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

---

## 10. Development vs Production

### Development Mode

**File:** `docker-compose.dev.yml`

**Features:**
- Hot module replacement (HMR) for frontend
- Auto-reload for backend (Uvicorn `--reload`)
- Source code mounted as volumes
- Debug logging enabled

**Start Development:**
```bash
docker-compose -f docker-compose.dev.yml up --build
```

**Development Dockerfile:**
- `Dockerfile.dev` (frontend)
- `migration_python/Dockerfile.dev` (backend)

---

### Production Mode

**File:** `docker-compose.yml`

**Features:**
- Optimized builds (multi-stage)
- Minified frontend assets
- Production-grade logging
- Health checks enabled
- Restart policies (`unless-stopped`)

**Start Production:**
```bash
docker-compose up -d --build
```

---

## 11. Health Checks

### Backend Health Check

**Endpoint:** `GET /health`  
**Interval:** 30 seconds  
**Timeout:** 10 seconds  
**Retries:** 3  
**Start Period:** 40 seconds

**Command:**
```bash
python -c "import requests; requests.get('http://localhost:8000/health')"
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-15T10:30:00Z"
}
```

---

### Redis Health Check

**Command:** `redis-cli ping`  
**Interval:** 10 seconds  
**Timeout:** 5 seconds  
**Retries:** 5

**Expected Response:** `PONG`

---

### Manual Health Checks

```bash
# Check all container health
docker-compose ps

# Check backend health
docker exec dex-backend curl http://localhost:8000/health

# Check Redis health
docker exec dex-redis redis-cli ping

# View health check logs
docker inspect --format='{{json .State.Health}}' dex-backend | jq
```

---

## 12. Troubleshooting

### Common Issues

#### Issue: Port Already in Use

**Error:**
```
Error starting userland proxy: listen tcp4 0.0.0.0:3000: bind: address already in use
```

**Solution:**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "3001:3000"  # Use different host port
```

---

#### Issue: Container Fails to Start

**Error:**
```
dex-backend exited with code 1
```

**Solution:**
```bash
# Check logs
docker-compose logs backend

# Check environment variables
docker exec dex-backend env

# Rebuild without cache
docker-compose build --no-cache backend
docker-compose up backend
```

---

#### Issue: Database Connection Error

**Error:**
```
sqlalchemy.exc.OperationalError: unable to open database file
```

**Solution:**
```bash
# Ensure volume exists
docker volume ls | grep backend-data

# Check volume permissions
docker exec dex-backend ls -la /app/data

# Recreate volume
docker-compose down -v
docker-compose up -d
```

---

#### Issue: Redis Connection Refused

**Error:**
```
redis.exceptions.ConnectionError: Error connecting to Redis
```

**Solution:**
```bash
# Check Redis container
docker-compose ps redis

# Test Redis connection
docker exec dex-redis redis-cli ping

# Restart Redis
docker-compose restart redis
```

---

### Debugging Commands

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend

# Execute command in container
docker exec -it dex-backend bash

# Inspect container
docker inspect dex-backend

# Check resource usage
docker stats

# View network details
docker network inspect dex-trading-agent_dex-network
```

---

## 13. Performance Optimization

### Build Optimization

**Use BuildKit:**
```bash
# Enable BuildKit for faster builds
export DOCKER_BUILDKIT=1
docker-compose build
```

**Layer Caching:**
- Copy `package.json` and `requirements.txt` first
- Install dependencies before copying source code
- Use `.dockerignore` to exclude unnecessary files

---

### Runtime Optimization

**Resource Limits:**

Add to `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

**Restart Policies:**
- `unless-stopped` - Restart unless manually stopped
- `always` - Always restart
- `on-failure` - Restart only on failure

---

### Image Size Reduction

**Current Sizes:**
- Frontend: ~150MB (Alpine + Node)
- Backend: ~300MB (Python 3.11-slim)
- Redis: ~30MB (Alpine)

**Optimization Tips:**
- Use Alpine Linux base images
- Multi-stage builds
- Remove build dependencies after installation
- Use `.dockerignore` to exclude dev files

---

## 14. Security Considerations

### Container Security

✅ **Non-root User:** Run containers as non-root (future enhancement)  
✅ **Read-only Filesystem:** Mount volumes as read-only where possible  
✅ **Network Isolation:** Use bridge network for internal communication  
✅ **Secret Management:** Use `.env` file (never commit to Git)  
✅ **Image Scanning:** Scan images for vulnerabilities

**Scan Images:**
```bash
# Install Trivy
brew install trivy

# Scan backend image
trivy image dex-trading-agent_backend

# Scan frontend image
trivy image dex-trading-agent_frontend
```

---

### Environment Security

**Best Practices:**
- Never commit `.env` file to Git
- Use Docker secrets for sensitive data (Swarm mode)
- Rotate API keys regularly
- Limit container capabilities

**Example: Docker Secrets (Swarm)**

```yaml
services:
  backend:
    secrets:
      - openrouter_api_key
    environment:
      - OPENROUTER_API_KEY_FILE=/run/secrets/openrouter_api_key

secrets:
  openrouter_api_key:
    file: ./secrets/openrouter_api_key.txt
```

---

## 15. Maintenance & Updates

### Update Images

```bash
# Pull latest base images
docker-compose pull

# Rebuild with latest dependencies
docker-compose build --no-cache

# Restart services
docker-compose up -d
```

---

### Database Migrations

```bash
# Run Alembic migrations
docker exec dex-backend alembic upgrade head

# Create new migration
docker exec dex-backend alembic revision --autogenerate -m "description"
```

---

### Cleanup

```bash
# Remove stopped containers
docker-compose rm

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Full cleanup (WARNING: removes everything)
docker system prune -a --volumes
```

---

### Backup Strategy

**Automated Backup Script:**

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup backend data
docker run --rm \
  -v dex-trading-agent_backend-data:/data \
  -v $(pwd)/$BACKUP_DIR:/backup \
  alpine tar czf /backup/backend-data-$TIMESTAMP.tar.gz -C /data .

# Backup Redis data
docker run --rm \
  -v dex-trading-agent_redis-data:/data \
  -v $(pwd)/$BACKUP_DIR:/backup \
  alpine tar czf /backup/redis-data-$TIMESTAMP.tar.gz -C /data .

echo "Backup completed: $BACKUP_DIR"
```

**Run Backup:**
```bash
chmod +x backup.sh
./backup.sh
```

---

## Summary

The DeX Trading Agent Docker setup provides:

✅ **Isolated Environment:** Containers for frontend, backend, and Redis  
✅ **Persistent Storage:** Volumes for database and cache  
✅ **Health Monitoring:** Automated health checks for all services  
✅ **Easy Deployment:** Single command to start entire stack  
✅ **Development Support:** Hot-reload and debugging capabilities  
✅ **Production Ready:** Optimized builds and restart policies  
✅ **Security:** Network isolation and secret management  
✅ **Maintainability:** Simple updates and backup procedures

**Quick Commands:**
```bash
# Start
docker-compose up -d --build

# Stop
docker-compose down

# Logs
docker-compose logs -f

# Restart
docker-compose restart

# Backup
./backup.sh
```

For additional support, refer to the [System Architecture](../Architecture/SYSTEM_ARCHITECTURE.md) and [Deployment Guide](../../DEPLOYMENT.md).

---

**Last Updated:** November 15, 2025  
**Maintained By:** VenTheZone
