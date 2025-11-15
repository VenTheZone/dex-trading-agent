#!/bin/bash

# DeX Trading Agent - Docker Stop Script
# Gracefully stops all containers

set -e

echo "🛑 Stopping DeX Trading Agent..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Stop containers
echo -e "${YELLOW}Stopping containers...${NC}"
docker compose down

echo ""
echo -e "${GREEN}✅ All containers stopped${NC}"
echo ""
echo "To remove volumes as well, run:"
echo "   docker compose down -v"
echo ""
