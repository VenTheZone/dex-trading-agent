#!/bin/bash

# DeX Trading Agent - Smart Docker Startup Script
# Handles container conflicts and ensures clean startup

set -e

echo "🚀 Starting DeX Trading Agent..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if container exists
container_exists() {
    docker ps -a --format '{{.Names}}' | grep -q "^$1$"
}

# Function to remove conflicting container
remove_container() {
    local container_name=$1
    echo -e "${YELLOW}⚠️  Removing conflicting container: $container_name${NC}"
    docker rm -f "$container_name" 2>/dev/null || true
    echo -e "${GREEN}✅ Container removed${NC}"
}

# Function to handle container conflicts
handle_conflicts() {
    local containers=("dex-backend" "dex-redis" "dex-frontend")
    
    for container in "${containers[@]}"; do
        if container_exists "$container"; then
            echo -e "${YELLOW}⚠️  Found existing container: $container${NC}"
            
            # Check if container is running
            if docker ps --format '{{.Names}}' | grep -q "^$container$"; then
                echo -e "${YELLOW}   Container is running, stopping...${NC}"
                docker stop "$container" 2>/dev/null || true
            fi
            
            # Remove the container
            remove_container "$container"
        fi
    done
}

# Function to clean up volumes if needed
clean_volumes() {
    if [ "$1" == "--clean" ]; then
        echo -e "${YELLOW}🧹 Cleaning up volumes...${NC}"
        docker volume rm dex-trading-agent_backend-data 2>/dev/null || true
        docker volume rm dex-trading-agent_redis-data 2>/dev/null || true
        echo -e "${GREEN}✅ Volumes cleaned${NC}"
    fi
}

# Main startup logic
main() {
    echo "📋 Checking for existing containers..."
    
    # Handle any conflicts
    handle_conflicts
    
    # Clean volumes if requested
    clean_volumes "$1"
    
    echo ""
    echo "🐳 Starting Docker Compose..."
    echo ""
    
    # Start Docker Compose with error handling
    if docker compose up -d --build; then
        echo ""
        echo -e "${GREEN}✅ DeX Trading Agent started successfully!${NC}"
        echo ""
        echo "📊 Services:"
        echo "   Frontend:  http://127.0.0.1:5173"
        echo "   Backend:   http://127.0.0.1:8000"
        echo "   Redis:     127.0.0.1:6379"
        echo ""
        echo "📝 View logs:"
        echo "   docker compose logs -f"
        echo ""
        echo "🛑 Stop services:"
        echo "   docker compose down"
        echo ""
    else
        echo ""
        echo -e "${RED}❌ Failed to start Docker Compose${NC}"
        echo ""
        echo "Troubleshooting:"
        echo "1. Check if ports are already in use:"
        echo "   lsof -i :5173 -i :8000 -i :6379"
        echo ""
        echo "2. Try cleaning volumes and restarting:"
        echo "   ./scripts/docker-start.sh --clean"
        echo ""
        echo "3. Check Docker logs:"
        echo "   docker compose logs"
        echo ""
        exit 1
    fi
}

# Run main function
main "$@"
