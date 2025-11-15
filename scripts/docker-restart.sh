#!/bin/bash

# DeX Trading Agent - Docker Restart Script
# Handles conflicts and restarts all services

set -e

echo "🔄 Restarting DeX Trading Agent..."
echo ""

# Stop existing containers
./scripts/docker-stop.sh

# Wait a moment
sleep 2

# Start with conflict handling
./scripts/docker-start.sh "$@"
