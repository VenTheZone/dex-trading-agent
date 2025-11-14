# Environment Variables - Configuration Reference

## Overview

The DeX Trading Agent uses environment variables for configuration across both the **React frontend** and **Python FastAPI backend**. This document provides a complete reference for all environment variables, their purposes, default values, validation rules, and configuration methods.

**Configuration Methods:**
1. **Backend Configuration:** `.env` file in `migration_python/` directory
2. **Frontend Configuration:** `.env.local` file in project root
3. **Browser Configuration:** API keys can be set via the web UI (stored in localStorage)
4. **Docker Configuration:** Environment variables in `docker-compose.yml`

**Last Updated:** November 15, 2025  
**Maintained By:** VenTheZone

---

## Table of Contents

1. [Frontend Environment Variables](#frontend-environment-variables)
2. [Backend Environment Variables](#backend-environment-variables)
3. [API Keys Configuration](#api-keys-configuration)
4. [Docker Environment Variables](#docker-environment-variables)
5. [Environment-Specific Configurations](#environment-specific-configurations)
6. [Validation & Security](#validation--security)
7. [Configuration Examples](#configuration-examples)
8. [Troubleshooting](#troubleshooting)

---

## 1. Frontend Environment Variables

### Location
- **Development:** `.env.local` (project root)
- **Production:** Set during Docker build or in hosting environment
- **Prefix:** All frontend variables must start with `VITE_`

### Available Variables

#### VITE_PYTHON_API_URL
- **Purpose:** Python backend API base URL
- **Type:** String (URL)
- **Required:** No
- **Default:** `http://localhost:8000`
- **Example:** `http://localhost:8000`
- **Usage:** Configures the frontend to communicate with the Python FastAPI backend
- **Notes:**
  - Must be accessible from the browser
  - No trailing slash
  - Use `http://localhost:8000` for local development
  - Use `http://backend:8000` for Docker internal networking

**Example:**
