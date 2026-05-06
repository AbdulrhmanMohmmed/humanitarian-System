"""Celery notification tasks — send emails, WebSocket pushes, SMS."""

import logging
from typing import Optional, List

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.notification_tasks.send_daily_summary")
def send_daily_summary():
    """Send daily operational summary to all managers."""
    try:
        from app.database import SessionLocal
        from app.models import User
        from app.models.enums import UserRole

        db = SessionLocal()
        try:
            managers = db.query(User).filter(
                User.role.in_([UserRole.ADMIN, UserRole.MANAGER]),
                User.is_active == True,
            ).all()

            for manager in managers:
                _send_notification_to_user(
                    user_id=manager.id,
                    title="ملخص اليوم",
                    body="تحقق من لوحة القيادة للاطلاع على آخر تحديثات المشاريع والتنبيهات.",
                    notification_type="info",
                    link="/",
                )

            logger.info(f"Daily summary sent to {len(managers)} managers")
            return {"sent_to": len(managers)}
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Daily summary failed: {e}")
        return {"error": str(e)}


@celery_app.task(name="app.tasks.notification_tasks.send_overdue_notification")
def send_overdue_notification(rec_id: int, title: str, deadline: str, assigned_to: str):
    """Notify a user about an overdue recommendation."""
    try:
        from app.database import SessionLocal
        from app.models import User

        db = SessionLocal()
        try:
            user = db.query(User).filter(
                (User.username == assigned_to) | (User.full_name == assigned_to)
            ).first()
            if user:
                _send_notification_to_user(
                    user_id=user.id,
                    title="⚠️ توصية متأخرة",
                    body=f"التوصية «{title}» تجاوزت موعد التنفيذ المحدد ({deadline}).",
                    notification_type="warning",
                    link="/recommendations",
                )
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Overdue notification failed for rec {rec_id}: {e}")


@celery_app.task(name="app.tasks.notification_tasks.send_report_notification")
def send_report_notification(report_id: int, recipients: Optional[List[str]] = None):
    """Notify users that a scheduled report is ready."""
    try:
        from app.database import SessionLocal
        from app.models import User

        if not recipients:
            return

        db = SessionLocal()
        try:
            for username in recipients:
                user = db.query(User).filter(User.username == username).first()
                if user:
                    _send_notification_to_user(
                        user_id=user.id,
                        title="📊 تقرير جديد جاهز",
                        body="تم إنشاء تقريرك المجدول وهو جاهز للتحميل.",
                        notification_type="success",
                        link="/scheduled-reports",
                    )
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Report notification failed for report {report_id}: {e}")


def _send_notification_to_user(
    user_id: int, title: str, body: str,
    notification_type: str = "info", link: Optional[str] = None
):
    """
    Send notification via WebSocket if user is online,
    otherwise persist to DB notification table.
    """
    import asyncio
    try:
        # Try WebSocket push (non-blocking)
        from app.websocket import manager, notify_user
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(
                notify_user(user_id, title, body, notification_type, link)
            )
        finally:
            loop.close()
    except Exception as e:
        logger.debug(f"WebSocket push skipped: {e}")

    # Persist to DB for offline users
    try:
        from app.database import SessionLocal
        from app.models import Notification
        from app.models.enums import NotificationType

        db = SessionLocal()
        try:
            notif = Notification(
                user_id=user_id,
                title=title,
                message=body,
                type=NotificationType.SYSTEM,
                is_read=False,
                link=link,
            )
            db.add(notif)
            db.commit()
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Failed to persist notification for user {user_id}: {e}")
