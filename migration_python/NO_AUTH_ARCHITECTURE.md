# No Authentication Architecture

## Overview
This project is designed for **local and private use only**. No authentication system is required.

## Simplified Architecture

### What's Removed:
- ❌ No Convex Auth
- ❌ No JWT tokens
- ❌ No user sessions
- ❌ No login/signup flows
- ❌ No `auth.middleware` imports
- ❌ No `get_current_user` dependencies

### What Stays:
- ✅ Direct API access (localhost only)
- ✅ All trading functionality
- ✅ Database for storing trades/logs/positions
- ✅ WebSocket for real-time updates
- ✅ Background workers (Celery)

## Implementation Notes

### Database Schema
- Keep `User` table for data organization (single default user)
- All `user_id` foreign keys point to default user (id=1)
- No email, password, or auth fields needed

### API Routes
- Remove all `Depends(get_current_user)` from endpoints
- Remove `from auth.middleware import get_current_user`
- Hardcode `user_id = 1` for all operations
- CORS: Allow `localhost:5173` (Vite dev server) only

### Security Considerations
- **Local only**: Bind to `127.0.0.1` (not `0.0.0.0`)
- **Firewall**: Block external access
- **API keys**: Store in `.env` file (never commit)
- **Private wallet**: Use dedicated wallet for trading

## Quick Start (No Auth)

