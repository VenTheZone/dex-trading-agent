# Local Development - Setting Up Dev Environment

## Overview

This guide provides complete instructions for setting up a local development environment for the DeX Trading Agent. It covers both frontend (React + TypeScript) and backend (Python FastAPI) setup, including all dependencies, configuration, and development workflows.

**Deployment Model:** Local development with hot reload  
**Architecture:** React frontend (port 5173) + Python backend (port 8000) + Redis (port 6379)  
**Development Tools:** Vite (frontend), Uvicorn (backend), pnpm (package manager)

**Last Updated:** November 15, 2025  
**Maintained By:** VenTheZone

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Requirements](#system-requirements)
3. [Frontend Setup (React + TypeScript)](#frontend-setup-react--typescript)
4. [Backend Setup (Python FastAPI)](#backend-setup-python-fastapi)
5. [Redis Setup](#redis-setup)
6. [Environment Configuration](#environment-configuration)
7. [Running the Development Server](#running-the-development-server)
8. [Development Workflow](#development-workflow)
9. [IDE Configuration](#ide-configuration)
10. [Testing Setup](#testing-setup)
11. [Troubleshooting](#troubleshooting)
12. [Development Best Practices](#development-best-practices)

---

## 1. Prerequisites

### Required Software

#### Node.js & pnpm
