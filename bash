# Check if Docker daemon is running
sudo systemctl status docker

# Test DNS resolution
ping docker.io

# Check Docker info
docker info

# Try pulling an image manually to see detailed error
docker pull python:3.11-slim
