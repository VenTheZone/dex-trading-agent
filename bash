# Stop Docker daemon
sudo systemctl stop docker

# Clean up the overlay2 directory issue
sudo rm -rf /home/jt/Games/Docker-Projects/docker/image/overlay2/layerdb/tmp/*

# Restart Docker
sudo systemctl start docker

# Rebuild
docker-compose up --build