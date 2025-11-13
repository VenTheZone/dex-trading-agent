# 1. Navigate to the Python backend
cd migration_python

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start Redis (required for Celery)
redis-server

# 5. Start the FastAPI server
python3 main.py
# Server will run on http://127.0.0.1:8000

# 6. In another terminal, start Celery worker
celery -A workers.celery_tasks worker --loglevel=info
