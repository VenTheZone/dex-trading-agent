// ... keep existing code (FROM python:3.11-slim and WORKDIR)
# Install system dependencies including curl for healthcheck
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Make startup script executable
RUN chmod +x /app/startup.sh

# Expose FastAPI port
EXPOSE 8000
// ... keep existing code (HEALTHCHECK and CMD)
