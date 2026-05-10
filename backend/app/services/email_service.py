"""Email notification service — SMTP-based email delivery."""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config import settings

logger = logging.getLogger(__name__)

# Email config from environment (add to Settings if needed)
SMTP_HOST = getattr(settings, "SMTP_HOST", "") or ""
SMTP_PORT = int(getattr(settings, "SMTP_PORT", "587") or "587")
SMTP_USER = getattr(settings, "SMTP_USER", "") or ""
SMTP_PASSWORD = getattr(settings, "SMTP_PASSWORD", "") or ""
SMTP_FROM = getattr(settings, "SMTP_FROM", "noreply@hiaos.org") or "noreply@hiaos.org"


def send_email(to: str, subject: str, body_html: str, body_text: str = "") -> bool:
    """Send an email. Returns True on success, False on failure."""
    if not SMTP_HOST:
        logger.warning("SMTP not configured — email not sent to %s", to)
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = SMTP_FROM
    msg["To"] = to
    msg["Subject"] = subject

    if body_text:
        msg.attach(MIMEText(body_text, "plain", "utf-8"))
    msg.attach(MIMEText(body_html, "html", "utf-8"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            if SMTP_USER and SMTP_PASSWORD:
                server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        logger.info("Email sent to %s: %s", to, subject)
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to, str(e))
        return False


def send_notification_email(to: str, title: str, message: str) -> bool:
    html = f"""
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1>HIAOS</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
            <h2>{title}</h2>
            <p>{message}</p>
        </div>
        <div style="padding: 10px; text-align: center; color: #6b7280; font-size: 12px;">
            نظام إدارة العمل الإنساني — HIAOS
        </div>
    </div>
    """
    return send_email(to, f"HIAOS: {title}", html, message)
