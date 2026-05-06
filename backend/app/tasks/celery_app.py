"""
Celery application configuration and task definitions.
Workers process: scheduled reports, notifications, data exports, AI batch tasks.

Start worker with:
    celery -A app.tasks.celery_app worker --loglevel=info -Q default,reports,ai

Start beat scheduler:
    celery -A app.tasks.celery_app beat --loglevel=info
"""

from celery import Celery
from celery.schedules import crontab
from app.config import settings

# ── Celery App ────────────────────────────────────────────────────────────────

celery_app = Celery(
    "hiaos",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.scheduled_tasks",
        "app.tasks.notification_tasks",
    ],
)

celery_app.conf.update(
    # Serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",

    # Timezone
    timezone="Asia/Aden",
    enable_utc=True,

    # Task routing
    task_routes={
        "app.tasks.scheduled_tasks.*": {"queue": "reports"},
        "app.tasks.notification_tasks.*": {"queue": "default"},
    },

    # Retry configuration
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_max_retries=3,
    task_default_retry_delay=60,

    # Result expiry
    result_expires=3600,  # 1 hour

    # Beat schedule (periodic tasks)
    beat_schedule={
        # Run scheduled reports check every 15 minutes
        "check-scheduled-reports": {
            "task": "app.tasks.scheduled_tasks.process_scheduled_reports",
            "schedule": crontab(minute="*/15"),
        },
        # Send daily summary at 8 AM
        "daily-summary-notification": {
            "task": "app.tasks.notification_tasks.send_daily_summary",
            "schedule": crontab(hour=8, minute=0),
        },
        # Check overdue recommendations daily at 9 AM
        "check-overdue-recommendations": {
            "task": "app.tasks.scheduled_tasks.check_overdue_recommendations",
            "schedule": crontab(hour=9, minute=0),
        },
        # Database health check every hour
        "db-health-check": {
            "task": "app.tasks.scheduled_tasks.database_health_check",
            "schedule": crontab(minute=0),
        },
    },
)
