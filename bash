# 1. Clean up Docker build cache (safe)
docker builder prune -a

# 2. Remove dangling images (safe)
docker image prune -a

# 3. Restart Docker daemon (safe)
sudo systemctl restart docker

# 4. Try building again with --no-cache
docker-compose build --no-cache
docker-compose up
