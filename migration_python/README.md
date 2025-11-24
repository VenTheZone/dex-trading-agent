# DeX Trading Agent - Python Backend

This is the Python backend migration for the DeX Trading Agent, replacing the Convex serverless backend with a FastAPI-based solution.

## 🎯 Architecture

- **Framework**: FastAPI (async Python web framework)
- **Database**: SQLite (local) or PostgreSQL (production)
- **Background Tasks**: Celery + Redis
- **WebSocket**: FastAPI WebSockets for real-time updates
- **Authentication**: None (local/private use only)

## 📋 Prerequisites

- Python 3.11+
- Redis (for Celery background tasks)
- PostgreSQL (optional, for production)

## 🚀 Quick Start

### 1. Create Virtual Environment

