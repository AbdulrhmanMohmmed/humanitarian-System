"""
Celery background tasks: scheduled reports, overdue checks, DB health.
"""

import logging
from datetime import datetime, timezone, timedelta, date

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    bind=True,
    name="app.tasks.scheduled_tasks.process_scheduled_reports",
    max_retries=3,
    default_retry_delay=120,
)
def process_scheduled_reports(self):
    """Find and generate all scheduled reports that are due."""
    try:
        from app.database import SessionLocal
        from app.models import ScheduledReport

        db = SessionLocal()
        try:
            now = datetime.now(timezone.utc)
            due_reports = db.query(ScheduledReport).filter(
                ScheduledReport.is_active == True,
                ScheduledReport.next_run_at <= now,
            ).all()

            processed = 0
            for report in due_reports:
                try:
                    _generate_and_send_report(report, db)
                    # Update next run time
                    report.last_run_at = now
                    report.next_run_at = _calculate_next_run(report.frequency, now)
                    db.commit()
                    processed += 1
                except Exception as e:
                    logger.error(f"Failed to generate scheduled report {report.id}: {e}")
                    db.rollback()

            logger.info(f"Processed {processed}/{len(due_reports)} scheduled reports")
            return {"processed": processed, "total_due": len(due_reports)}
        finally:
            db.close()
    except Exception as exc:
        logger.error(f"Scheduled reports task failed: {exc}")
        raise self.retry(exc=exc)


def _generate_and_send_report(report, db):
    """Generate a single scheduled report and notify recipients."""
    from app.tasks.notification_tasks import send_report_notification
    # Placeholder for actual report generation logic
    logger.info(f"Generating scheduled report: {report.id} - {report.name}")
    send_report_notification.delay(report.id, report.recipients)


def _calculate_next_run(frequency: str, from_time: datetime) -> datetime:
    """Calculate next run time based on frequency string."""
    freq_map = {
        "daily": timedelta(days=1),
        "weekly": timedelta(weeks=1),
        "monthly": timedelta(days=30),
        "quarterly": timedelta(days=90),
    }
    delta = freq_map.get(frequency, timedelta(days=1))
    return from_time + delta


@celery_app.task(
    bind=True,
    name="app.tasks.scheduled_tasks.check_overdue_recommendations",
    max_retries=2,
)
def check_overdue_recommendations(self):
    """Check for overdue recommendations and notify responsible staff."""
    try:
        from app.database import SessionLocal
        from app.models import Recommendation, RecommendationStatus
        from app.tasks.notification_tasks import send_overdue_notification

        db = SessionLocal()
        try:
            today = date.today()
            overdue = db.query(Recommendation).filter(
                Recommendation.deadline < today,
                Recommendation.status.notin_([
                    RecommendationStatus.COMPLETED,
                    RecommendationStatus.CANCELLED,
                ]),
            ).all()

            for rec in overdue:
                # Update status to overdue
                if rec.status != RecommendationStatus.OVERDUE:
                    rec.status = RecommendationStatus.OVERDUE
                    db.commit()

                # Notify assigned user if known
                if rec.assigned_to:
                    send_overdue_notification.delay(
                        rec.id, rec.title, str(rec.deadline), rec.assigned_to
                    )

            logger.info(f"Checked overdue recommendations: {len(overdue)} overdue")
            return {"overdue_count": len(overdue)}
        finally:
            db.close()
    except Exception as exc:
        raise self.retry(exc=exc)


@celery_app.task(name="app.tasks.scheduled_tasks.database_health_check")
def database_health_check():
    """Basic DB health check — logs if connection pool is exhausted."""
    try:
        from app.database import engine
        with engine.connect() as conn:
            conn.execute(engine.dialect.statement_compiler(engine.dialect, None).visit_textclause("SELECT 1"))
        return {"status": "ok", "checked_at": datetime.now(timezone.utc).isoformat()}
    except Exception as e:
        logger.error(f"DB health check failed: {e}")
        return {"status": "error", "error": str(e)}
