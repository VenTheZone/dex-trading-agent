"""Celery configuration"""
import os
from celery.schedules import crontab

# Celery Configuration
broker_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
result_backend = os.getenv("REDIS_URL", "redis://localhost:6379/0")

task_serializer = "json"
accept_content = ["json"]
result_serializer = "json"
timezone = "UTC"
enable_utc = True

# Beat schedule for periodic tasks
beat_schedule = {
    "ai-trading-analysis-every-5-minutes": {
        "task": "workers.celery_tasks.run_ai_trading_analysis",
        "schedule": crontab(minute="*/5"),  # Every 5 minutes
    },
    "update-balance-history-every-15-minutes": {
        "task": "workers.celery_tasks.update_balance_history",
        "schedule": crontab(minute="*/15"),  # Every 15 minutes
    },
    "update-position-snapshots-every-5-minutes": {
        "task": "workers.celery_tasks.update_position_snapshots",
        "schedule": crontab(minute="*/5"),  # Every 5 minutes
    },
}
