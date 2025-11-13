cd migration_python
celery -A workers.celery_tasks worker --loglevel=info