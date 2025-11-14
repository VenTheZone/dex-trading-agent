# 1. Test frontend (should pass)
pnpm diagnose:price

# 2. Check backend errors
docker-compose logs backend | grep -i "price"