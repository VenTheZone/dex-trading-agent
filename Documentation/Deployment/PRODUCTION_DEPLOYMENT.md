# Production Deployment - Best Practices & Guidelines

## Overview

This document provides comprehensive best practices for deploying the DeX Trading Agent in a production environment. While the system is designed for **local-only deployment**, these guidelines ensure maximum security, reliability, and performance for serious trading operations.

**Deployment Model:** Local production deployment (no cloud configurations)  
**Target Users:** Individual traders running live trading with real funds  
**Security Model:** Network isolation + firewall protection + encrypted storage

**Last Updated:** November 15, 2025  
**Maintained By:** VenTheZone

---

## Table of Contents

1. [Production Architecture](#production-architecture)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Security Hardening](#security-hardening)
4. [Database Configuration](#database-configuration)
5. [Performance Optimization](#performance-optimization)
6. [Monitoring & Logging](#monitoring--logging)
7. [Backup & Recovery](#backup--recovery)
8. [Network Configuration](#network-configuration)
9. [Resource Management](#resource-management)
10. [Operational Procedures](#operational-procedures)
11. [Troubleshooting Production Issues](#troubleshooting-production-issues)
12. [Maintenance Schedule](#maintenance-schedule)

---

## 1. Production Architecture

### Recommended Setup

```
┌─────────────────────────────────────────────────────────────┐
│                    LOCAL MACHINE (Production)                │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Frontend   │  │   Backend    │  │    Redis     │      │
│  │  (Port 3000) │  │  (Port 8000) │  │  (Port 6379) │      │
│  │   React UI   │  │   FastAPI    │  │   Message    │      │
│  │              │  │              │  │    Broker    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┴──────────────────┘               │
│                           │                                  │
│                  ┌────────▼────────┐                         │
│                  │   PostgreSQL    │                         │
│                  │   (Port 5432)   │                         │
│                  │   Production    │                         │
│                  │    Database     │                         │
│                  └─────────────────┘                         │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Firewall (UFW/Windows Firewall)         │   │
│  │  - Block all external access to ports 3000, 8000     │   │
│  │  - Allow only localhost (127.0.0.1) connections      │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   External Services    │
              │  - Hyperliquid API     │
              │  - OpenRouter AI       │
              │  - Binance API         │
              │  - CryptoPanic         │
              └────────────────────────┘
```

### Key Production Components

1. **PostgreSQL Database** (instead of SQLite)
   - ACID compliance for critical trading data
   - Better concurrent access handling
   - Improved performance for large datasets

2. **Redis** (persistent mode)
   - Message broker for Celery
   - Caching layer for market data
   - Session storage

3. **Celery Workers** (multiple instances)
   - Auto-trading loop execution
   - Background task processing
   - Position monitoring

4. **Reverse Proxy** (optional but recommended)
   - Nginx or Caddy for SSL termination
   - Rate limiting
   - Request logging

---

## 2. Pre-Deployment Checklist

### ✅ System Requirements

**Minimum Production Specs:**
- **CPU:** 4 cores (8 threads recommended)
- **RAM:** 8GB (16GB recommended)
- **Storage:** 50GB SSD (100GB+ for long-term logs)
- **Network:** Stable internet (10+ Mbps, low latency)
- **OS:** Ubuntu 22.04 LTS / macOS 13+ / Windows 11 Pro

### ✅ Software Dependencies

```bash
# Check versions
node --version    # v18.0.0+
python --version  # v3.11.0+
docker --version  # v24.0.0+
redis-cli --version  # v7.0.0+
psql --version    # v15.0+ (if using PostgreSQL)
```

### ✅ API Keys & Credentials

- [ ] **Hyperliquid API Keys** configured and tested on testnet
- [ ] **OpenRouter API Key** with sufficient credits
- [ ] **Binance API Key** (optional, for price feeds)
- [ ] **CryptoPanic API Key** (optional, for news)
- [ ] All keys stored in `.env` file (never in code)
- [ ] Backup of API keys stored securely offline

### ✅ Security Checklist

- [ ] Firewall enabled and configured
- [ ] All ports blocked except localhost
- [ ] Strong passwords for database
- [ ] SSH keys configured (if remote access needed)
- [ ] Disk encryption enabled
- [ ] Antivirus/malware protection active
- [ ] OS and all software up to date

### ✅ Testing Checklist

- [ ] All 135 frontend tests passing (`pnpm test`)
- [ ] Backend tests passing (`pytest`)
- [ ] Testnet trading tested successfully
- [ ] Paper trading mode validated
- [ ] AI analysis working correctly
- [ ] Risk management systems tested
- [ ] Backup/restore procedures tested

---

## 3. Security Hardening

### 3.1 Firewall Configuration

#### Linux (UFW)

```bash
# Enable firewall
sudo ufw enable

# Block all incoming by default
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (if needed for remote access)
sudo ufw allow 22/tcp

# Verify no external access to app ports
sudo ufw status verbose

# Expected output: No rules for 3000, 8000, 6379, 5432
```

#### macOS (pf)

```bash
# Edit /etc/pf.conf
sudo nano /etc/pf.conf

# Add rules to block external access
block in proto tcp from any to any port 3000
block in proto tcp from any to any port 8000
block in proto tcp from any to any port 6379
block in proto tcp from any to any port 5432

# Load rules
sudo pfctl -f /etc/pf.conf
sudo pfctl -e
```

#### Windows (Windows Defender Firewall)

```powershell
# Block inbound connections to app ports
New-NetFirewallRule -DisplayName "Block Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Block
New-NetFirewallRule -DisplayName "Block Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Block
New-NetFirewallRule -DisplayName "Block Redis" -Direction Inbound -LocalPort 6379 -Protocol TCP -Action Block
New-NetFirewallRule -DisplayName "Block PostgreSQL" -Direction Inbound -LocalPort 5432 -Protocol TCP -Action Block
```

### 3.2 Environment Variables Security

**Production `.env` Template:**

```bash
# Backend (.env in migration_python/)
DATABASE_URL=postgresql://trading_user:STRONG_PASSWORD_HERE@localhost:5432/trading_db
REDIS_URL=redis://localhost:6379/0
OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE
CRYPTOPANIC_AUTH_TOKEN=YOUR_TOKEN_HERE
HYPERLIQUID_API_URL=https://api.hyperliquid.xyz
CORS_ORIGINS=http://localhost:3000
LOG_LEVEL=INFO
ENVIRONMENT=production

# Security settings
SECRET_KEY=GENERATE_RANDOM_64_CHAR_STRING_HERE
SESSION_TIMEOUT=3600
MAX_LOGIN_ATTEMPTS=5
```

**Generate Strong Secrets:**

```bash
# Generate SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(64))"

# Generate database password
openssl rand -base64 32
```

### 3.3 Database Security

**PostgreSQL Configuration:**

```sql
-- Create dedicated user with limited privileges
CREATE USER trading_user WITH PASSWORD 'STRONG_PASSWORD_HERE';
CREATE DATABASE trading_db OWNER trading_user;

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE trading_db TO trading_user;
GRANT USAGE ON SCHEMA public TO trading_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO trading_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO trading_user;

-- Revoke dangerous permissions
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
```

**PostgreSQL `pg_hba.conf`:**

```conf
# Only allow local connections
local   all             all                                     scram-sha-256
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
```

### 3.4 API Key Storage

**Best Practices:**

1. **Never commit `.env` files to Git**
   ```bash
   # Verify .env is in .gitignore
   grep -q "^\.env$" .gitignore || echo ".env" >> .gitignore
   ```

2. **Encrypt sensitive files at rest**
   ```bash
   # Linux: Use LUKS disk encryption
   # macOS: Use FileVault
   # Windows: Use BitLocker
   ```

3. **Backup API keys offline**
   - Store in password manager (1Password, Bitwarden)
   - Print physical backup stored in safe
   - Never store in cloud services

4. **Rotate keys regularly**
   - Hyperliquid: Generate new agent wallet every 90 days
   - OpenRouter: Rotate API key every 6 months
   - Update `.env` and restart services

---

## 4. Database Configuration

### 4.1 PostgreSQL Setup

**Installation:**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql@15
brew services start postgresql@15

# Windows
# Download installer from https://www.postgresql.org/download/windows/
```

**Database Initialization:**

```bash
# Create database and user
sudo -u postgres psql

CREATE DATABASE trading_db;
CREATE USER trading_user WITH PASSWORD 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE trading_db TO trading_user;
\q

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://trading_user:YOUR_STRONG_PASSWORD@localhost:5432/trading_db
```

**Run Migrations:**

```bash
cd migration_python
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install Alembic if not already installed
pip install alembic

# Initialize Alembic (if not done)
alembic init alembic

# Create initial migration
alembic revision --autogenerate -m "Initial schema"

# Apply migrations
alembic upgrade head
```

### 4.2 Database Optimization

**PostgreSQL Configuration (`postgresql.conf`):**

```conf
# Memory settings (adjust based on available RAM)
shared_buffers = 2GB                # 25% of RAM
effective_cache_size = 6GB          # 75% of RAM
maintenance_work_mem = 512MB
work_mem = 16MB

# Connection settings
max_connections = 100
shared_preload_libraries = 'pg_stat_statements'

# Write-ahead log
wal_buffers = 16MB
checkpoint_completion_target = 0.9
max_wal_size = 2GB

# Query planner
random_page_cost = 1.1              # For SSD
effective_io_concurrency = 200      # For SSD
```

**Indexes for Performance:**

```sql
-- Trading logs
CREATE INDEX idx_trading_logs_created_at ON trading_logs(created_at DESC);
CREATE INDEX idx_trading_logs_symbol ON trading_logs(symbol);
CREATE INDEX idx_trading_logs_mode ON trading_logs(mode);

-- Balance history
CREATE INDEX idx_balance_history_created_at ON balance_history(created_at DESC);
CREATE INDEX idx_balance_history_mode ON balance_history(mode);

-- Position snapshots
CREATE INDEX idx_position_snapshots_symbol ON position_snapshots(symbol);
CREATE INDEX idx_position_snapshots_created_at ON position_snapshots(created_at DESC);
```

### 4.3 Database Maintenance

**Daily Maintenance Script:**

```bash
#!/bin/bash
# daily_db_maintenance.sh

# Vacuum and analyze
psql -U trading_user -d trading_db -c "VACUUM ANALYZE;"

# Reindex
psql -U trading_user -d trading_db -c "REINDEX DATABASE trading_db;"

# Check database size
psql -U trading_user -d trading_db -c "SELECT pg_size_pretty(pg_database_size('trading_db'));"
```

**Automated Cleanup:**

```sql
-- Delete old logs (keep 90 days)
DELETE FROM trading_logs WHERE created_at < NOW() - INTERVAL '90 days';

-- Delete old balance history (keep 180 days)
DELETE FROM balance_history WHERE created_at < NOW() - INTERVAL '180 days';

-- Delete old position snapshots (keep 90 days)
DELETE FROM position_snapshots WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## 5. Performance Optimization

### 5.1 Backend Optimization

**Uvicorn Production Settings:**

```bash
# Start with multiple workers
uvicorn main:app \
  --host 127.0.0.1 \
  --port 8000 \
  --workers 4 \
  --loop uvloop \
  --log-level info \
  --access-log \
  --no-server-header
```

**Celery Worker Configuration:**

```bash
# Start multiple workers for parallel processing
celery -A workers.celery_app worker \
  --loglevel=info \
  --concurrency=4 \
  --max-tasks-per-child=1000 \
  --time-limit=300 \
  --soft-time-limit=240
```

### 5.2 Redis Configuration

**Production `redis.conf`:**

```conf
# Persistence
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec

# Memory management
maxmemory 2gb
maxmemory-policy allkeys-lru

# Security
bind 127.0.0.1
protected-mode yes
requirepass YOUR_REDIS_PASSWORD_HERE

# Performance
tcp-backlog 511
timeout 0
tcp-keepalive 300
```

### 5.3 Frontend Optimization

**Production Build:**

```bash
# Build with optimizations
pnpm build

# Verify build size
du -sh dist/

# Expected: < 5MB for optimized build
```

**Nginx Configuration (Optional):**

```nginx
server {
    listen 80;
    server_name localhost;
    
    # Frontend
    location / {
        root /path/to/dex-trading-agent/dist;
        try_files $uri $uri/ /index.html;
        
        # Caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket
    location /ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## 6. Monitoring & Logging

### 6.1 Application Logging

**Backend Logging Configuration:**

```python
# migration_python/main.py
import logging
from logging.handlers import RotatingFileHandler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler(
            'logs/app.log',
            maxBytes=10485760,  # 10MB
            backupCount=10
        ),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)
```

**Log Rotation Script:**

```bash
#!/bin/bash
# rotate_logs.sh

LOG_DIR="logs"
ARCHIVE_DIR="logs/archive"
DAYS_TO_KEEP=30

# Create archive directory
mkdir -p $ARCHIVE_DIR

# Compress old logs
find $LOG_DIR -name "*.log" -mtime +1 -exec gzip {} \;

# Move compressed logs to archive
find $LOG_DIR -name "*.log.gz" -exec mv {} $ARCHIVE_DIR/ \;

# Delete old archives
find $ARCHIVE_DIR -name "*.log.gz" -mtime +$DAYS_TO_KEEP -delete
```

### 6.2 System Monitoring

**Resource Monitoring Script:**

```bash
#!/bin/bash
# monitor_resources.sh

echo "=== System Resources ==="
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1

echo "Memory Usage:"
free -h | grep Mem | awk '{print $3 "/" $2}'

echo "Disk Usage:"
df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 ")"}'

echo "=== Application Status ==="
echo "Backend:"
curl -s http://localhost:8000/health | jq .

echo "Redis:"
redis-cli ping

echo "PostgreSQL:"
psql -U trading_user -d trading_db -c "SELECT 1;" > /dev/null && echo "OK" || echo "FAIL"
```

### 6.3 Trading Metrics

**Key Metrics to Monitor:**

1. **Trade Execution Latency**
   - Target: < 500ms for live trades
   - Alert if > 2 seconds

2. **AI Analysis Time**
   - Target: 2-5 seconds (DeepSeek), 3-7 seconds (Qwen)
   - Alert if > 15 seconds

3. **Position Monitoring Frequency**
   - Target: Every 5 seconds
   - Alert if > 30 seconds

4. **Balance Update Latency**
   - Target: < 1 second
   - Alert if > 5 seconds

5. **WebSocket Connection Stability**
   - Target: 99.9% uptime
   - Alert on disconnections

**Monitoring Dashboard (Simple):**

```python
# migration_python/api/monitoring.py
from fastapi import APIRouter
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/metrics")
async def get_metrics():
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "uptime": get_uptime(),
        "trades_today": get_trade_count(timedelta(days=1)),
        "avg_execution_time": get_avg_execution_time(),
        "active_positions": get_active_position_count(),
        "balance": get_current_balance(),
        "pnl_today": get_pnl(timedelta(days=1)),
        "ai_analysis_count": get_ai_analysis_count(timedelta(days=1)),
        "error_count": get_error_count(timedelta(hours=1))
    }
```

---

## 7. Backup & Recovery

### 7.1 Database Backup

**Automated Backup Script:**

```bash
#!/bin/bash
# backup_database.sh

BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="trading_db"
DB_USER="trading_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U $DB_USER -d $DB_NAME -F c -f "$BACKUP_DIR/trading_db_$DATE.backup"

# Compress backup
gzip "$BACKUP_DIR/trading_db_$DATE.backup"

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.backup.gz" -mtime +30 -delete

echo "Backup completed: trading_db_$DATE.backup.gz"
```

**Cron Job for Daily Backups:**

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup_database.sh >> /var/log/db_backup.log 2>&1
```

### 7.2 Configuration Backup

**Backup Script:**

```bash
#!/bin/bash
# backup_config.sh

BACKUP_DIR="/path/to/config_backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup .env files (encrypted)
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" \
  migration_python/.env \
  .env.local \
  docker-compose.yml

# Encrypt backup
gpg --symmetric --cipher-algo AES256 "$BACKUP_DIR/config_$DATE.tar.gz"
rm "$BACKUP_DIR/config_$DATE.tar.gz"

echo "Config backup completed: config_$DATE.tar.gz.gpg"
```

### 7.3 Disaster Recovery

**Recovery Procedure:**

1. **Restore Database:**
   ```bash
   # Stop application
   docker-compose down
   
   # Restore from backup
   gunzip trading_db_20251115_020000.backup.gz
   pg_restore -U trading_user -d trading_db -c trading_db_20251115_020000.backup
   
   # Restart application
   docker-compose up -d
   ```

2. **Restore Configuration:**
   ```bash
   # Decrypt backup
   gpg --decrypt config_20251115_020000.tar.gz.gpg > config_20251115_020000.tar.gz
   
   # Extract files
   tar -xzf config_20251115_020000.tar.gz
   
   # Verify .env files
   cat migration_python/.env
   ```

3. **Verify System:**
   ```bash
   # Check health
   curl http://localhost:8000/health
   
   # Check database
   psql -U trading_user -d trading_db -c "SELECT COUNT(*) FROM trading_logs;"
   
   # Check balance
   curl http://localhost:8000/api/balance-history?limit=1
   ```

---

## 8. Network Configuration

### 8.1 Localhost-Only Access

**Verify Localhost Binding:**

```bash
# Check listening ports
sudo netstat -tulpn | grep -E '3000|8000|6379|5432'

# Expected output (all should show 127.0.0.1):
# tcp  0  0  127.0.0.1:3000  0.0.0.0:*  LISTEN  12345/node
# tcp  0  0  127.0.0.1:8000  0.0.0.0:*  LISTEN  12346/python
# tcp  0  0  127.0.0.1:6379  0.0.0.0:*  LISTEN  12347/redis
# tcp  0  0  127.0.0.1:5432  0.0.0.0:*  LISTEN  12348/postgres
```

### 8.2 External API Rate Limiting

**Implement Rate Limiting:**

```python
# migration_python/middleware/rate_limit.py
from fastapi import Request, HTTPException
from collections import defaultdict
from datetime import datetime, timedelta

class RateLimiter:
    def __init__(self):
        self.requests = defaultdict(list)
    
    async def check_rate_limit(self, request: Request, max_requests: int = 60, window: int = 60):
        client_ip = request.client.host
        now = datetime.utcnow()
        
        # Clean old requests
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if now - req_time < timedelta(seconds=window)
        ]
        
        # Check limit
        if len(self.requests[client_ip]) >= max_requests:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        self.requests[client_ip].append(now)
```

---

## 9. Resource Management

### 9.1 Docker Resource Limits

**Production `docker-compose.yml`:**

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
    restart: unless-stopped
  
  redis:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 2G
        reservations:
          cpus: '0.25'
          memory: 512M
    restart: unless-stopped
```

### 9.2 Process Management

**Systemd Service (Linux):**

```ini
# /etc/systemd/system/dex-trading-agent.service
[Unit]
Description=DeX Trading Agent
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=trading
WorkingDirectory=/home/trading/dex-trading-agent
ExecStart=/usr/local/bin/docker-compose up
ExecStop=/usr/local/bin/docker-compose down
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Enable and Start:**

```bash
sudo systemctl enable dex-trading-agent
sudo systemctl start dex-trading-agent
sudo systemctl status dex-trading-agent
```

---

## 10. Operational Procedures

### 10.1 Startup Procedure

1. **Pre-Start Checks:**
   ```bash
   # Verify system resources
   free -h
   df -h
   
   # Check network connectivity
   ping -c 3 api.hyperliquid.xyz
   ping -c 3 openrouter.ai
   
   # Verify database
   psql -U trading_user -d trading_db -c "SELECT 1;"
   ```

2. **Start Services:**
   ```bash
   # Start Docker services
   docker-compose up -d
   
   # Verify all containers running
   docker-compose ps
   
   # Check logs
   docker-compose logs -f --tail=50
   ```

3. **Post-Start Verification:**
   ```bash
   # Health check
   curl http://localhost:8000/health
   
   # Test Hyperliquid connection
   curl "http://localhost:8000/api/hyperliquid/test-connection?isTestnet=false"
   
   # Verify frontend
   curl http://localhost:3000
   ```

### 10.2 Shutdown Procedure

1. **Graceful Shutdown:**
   ```bash
   # Stop auto-trading first
   # (via UI: disable auto-trading toggle)
   
   # Close all positions (if desired)
   # (via UI: close all positions button)
   
   # Stop Docker services
   docker-compose down
   ```

2. **Emergency Shutdown:**
   ```bash
   # Force stop all containers
   docker-compose kill
   
   # Verify all stopped
   docker-compose ps
   ```

### 10.3 Update Procedure

1. **Backup Before Update:**
   ```bash
   ./backup_database.sh
   ./backup_config.sh
   ```

2. **Pull Latest Code:**
   ```bash
   git fetch origin
   git checkout main
   git pull origin main
   ```

3. **Update Dependencies:**
   ```bash
   # Frontend
   pnpm install
   pnpm build
   
   # Backend
   cd migration_python
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Run Migrations:**
   ```bash
   alembic upgrade head
   ```

5. **Restart Services:**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

6. **Verify Update:**
   ```bash
   curl http://localhost:8000/health
   docker-compose logs -f --tail=50
   ```

---

## 11. Troubleshooting Production Issues

### Common Issues & Solutions

#### Issue 1: High CPU Usage

**Symptoms:**
- CPU usage > 80%
- Slow response times
- UI lag

**Diagnosis:**
```bash
# Check process CPU usage
top -o %CPU

# Check Docker container stats
docker stats
```

**Solutions:**
- Reduce Celery worker concurrency
- Optimize database queries
- Increase polling intervals
- Add more CPU cores

#### Issue 2: Memory Leaks

**Symptoms:**
- Increasing memory usage over time
- OOM (Out of Memory) errors
- Container restarts

**Diagnosis:**
```bash
# Monitor memory usage
watch -n 5 free -h

# Check container memory
docker stats --no-stream
```

**Solutions:**
- Restart Celery workers periodically (`--max-tasks-per-child=1000`)
- Clear Redis cache regularly
- Optimize database connection pooling
- Increase available RAM

#### Issue 3: Database Connection Errors

**Symptoms:**
- "Too many connections" errors
- Slow database queries
- Connection timeouts

**Diagnosis:**
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check long-running queries
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;
```

**Solutions:**
- Increase `max_connections` in PostgreSQL
- Optimize connection pooling in SQLAlchemy
- Kill long-running queries
- Add database indexes

#### Issue 4: WebSocket Disconnections

**Symptoms:**
- Frequent WebSocket reconnections
- Missing real-time updates
- "Connection lost" errors

**Diagnosis:**
```bash
# Check WebSocket connections
netstat -an | grep 8000 | grep ESTABLISHED

# Check backend logs
docker-compose logs backend | grep -i websocket
```

**Solutions:**
- Increase WebSocket timeout
- Implement reconnection logic
- Check network stability
- Verify firewall rules

#### Issue 5: AI Analysis Failures

**Symptoms:**
- "AI analysis failed" errors
- Timeout errors
- No trading decisions

**Diagnosis:**
```bash
# Check OpenRouter API status
curl https://openrouter.ai/api/v1/models

# Check backend logs
docker-compose logs backend | grep -i "ai analysis"
```

**Solutions:**
- Verify OpenRouter API key
- Check API rate limits
- Increase timeout settings
- Switch to backup AI model
- Verify network connectivity

---

## 12. Maintenance Schedule

### Daily Tasks

- [ ] Check system health (`curl http://localhost:8000/health`)
- [ ] Review trading logs for errors
- [ ] Monitor balance and P&L
- [ ] Verify all positions are tracked correctly
- [ ] Check disk space (`df -h`)

### Weekly Tasks

- [ ] Review performance metrics
- [ ] Analyze trading performance
- [ ] Check for software updates
- [ ] Review and rotate logs
- [ ] Verify backup integrity
- [ ] Test disaster recovery procedure

### Monthly Tasks

- [ ] Full system backup
- [ ] Database maintenance (VACUUM, REINDEX)
- [ ] Security audit (check firewall, API keys)
- [ ] Performance optimization review
- [ ] Update dependencies
- [ ] Review and optimize trading strategy

### Quarterly Tasks

- [ ] Rotate API keys
- [ ] Full disaster recovery test
- [ ] Hardware health check
- [ ] Security vulnerability scan
- [ ] Review and update documentation
- [ ] Capacity planning review

---

## Production Deployment Checklist

### Pre-Production

- [ ] All tests passing (frontend + backend)
- [ ] Testnet trading validated
- [ ] Security hardening completed
- [ ] Firewall configured
- [ ] Database optimized
- [ ] Monitoring setup
- [ ] Backup procedures tested
- [ ] Documentation reviewed

### Production Launch

- [ ] Start with small position sizes
- [ ] Enable auto-trading gradually
- [ ] Monitor closely for first 24 hours
- [ ] Verify all risk management systems active
- [ ] Test emergency shutdown procedure
- [ ] Document any issues encountered

### Post-Production

- [ ] Daily monitoring for first week
- [ ] Weekly performance review
- [ ] Adjust settings based on results
- [ ] Optimize based on real-world data
- [ ] Update documentation with lessons learned

---

## Emergency Contacts & Resources

### Support Resources

- **GitHub Issues:** https://github.com/VenTheZone/dex-trading-agent/issues
- **Documentation:** `/docs` route in application
- **Hyperliquid Support:** https://discord.gg/hyperliquid
- **OpenRouter Support:** https://openrouter.ai/docs

### Emergency Procedures

**Critical Issue (Funds at Risk):**
1. Immediately close all positions via UI
2. Disable auto-trading
3. Stop all services: `docker-compose down`
4. Contact Hyperliquid support if needed
5. Review logs to identify issue
6. Do not restart until issue resolved

**System Compromise:**
1. Immediately disconnect from internet
2. Stop all services
3. Rotate all API keys
4. Review system logs for unauthorized access
5. Restore from clean backup
6. Conduct full security audit before resuming

---

## Conclusion

Production deployment of the DeX Trading Agent requires careful attention to security, performance, and operational procedures. This guide provides a comprehensive framework for running the system reliably with real funds.

**Key Takeaways:**

✅ **Security First:** Network isolation, firewall protection, encrypted storage  
✅ **Monitoring:** Continuous health checks, logging, and alerting  
✅ **Backups:** Automated daily backups with tested recovery procedures  
✅ **Performance:** Optimized database, caching, and resource management  
✅ **Operations:** Clear procedures for startup, shutdown, updates, and emergencies

**Remember:** Start small, monitor closely, and scale gradually. Never risk more than you can afford to lose.

---

**Last Updated:** November 15, 2025  
**Version:** 1.0.0  
**Maintained By:** VenTheZone

**Disclaimer:** This software is provided for educational purposes. Trading cryptocurrencies involves substantial risk of loss. Always test thoroughly on testnet before using real funds.
