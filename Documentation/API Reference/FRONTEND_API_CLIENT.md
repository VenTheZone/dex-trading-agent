# Frontend API Client - TypeScript Usage Guide

## Overview

The DeX Trading Agent frontend uses a **TypeScript API client** (`python-api-client.ts`) to communicate with the Python FastAPI backend. This document provides complete usage patterns, React hooks, error handling, and integration examples.

**Client Location:** `src/lib/python-api-client.ts`

**Base URL:** Configured via `VITE_PYTHON_API_URL` environment variable (default: `http://localhost:8000`)

**Last Updated:** November 15, 2025

---

## Table of Contents

1. [Core API Client](#core-api-client)
2. [React Hooks](#react-hooks)
3. [Trading Operations](#trading-operations)
4. [AI Analysis Integration](#ai-analysis-integration)
5. [Real-Time Updates](#real-time-updates)
6. [Error Handling](#error-handling)
7. [Type Definitions](#type-definitions)
8. [Usage Examples](#usage-examples)
9. [Best Practices](#best-practices)

---

## 1. Core API Client

### PythonApiClient Class

The main client class provides methods for all backend operations.

**Import:**
