"""
AI service layer. Wraps OpenAI calls with graceful fallback.
All AI endpoints fall back to mock responses when OPENAI_API_KEY is not set.
"""

import json
import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


def _get_client():
    """Get OpenAI client if available."""
    if not settings.AI_ENABLED or not settings.OPENAI_API_KEY:
        return None
    import openai
    return openai.OpenAI(api_key=settings.OPENAI_API_KEY)


def _chat(system_prompt: str, user_content: str, max_tokens: int = 1000) -> Optional[dict]:
    """Make a chat completion call, return parsed JSON or None."""
    client = _get_client()
    if not client:
        return None
    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
        )
        content = response.choices[0].message.content
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {"raw_response": content, "ai_powered": True}
    except Exception as e:
        logger.warning("AI service error: %s", e)
        return None


def classify_complaint(complaint_text: str, category_hint: str = "") -> dict:
    """Classify a CFM complaint by severity and category."""
    result = _chat(
        system_prompt=(
            "You are a humanitarian complaint classifier. Classify the complaint and return JSON with: "
            "severity (critical/high/medium/low), category (protection/service_delivery/staff_conduct/"
            "feedback/other), suggested_action (string), is_sensitive (boolean), "
            "requires_escalation (boolean)."
        ),
        user_content=f"Complaint: {complaint_text}\nCategory hint: {category_hint}",
    )
    if result:
        result["ai_powered"] = True
        return result
    return {
        "severity": "medium",
        "category": "other",
        "suggested_action": "Manual review required",
        "is_sensitive": False,
        "requires_escalation": False,
        "ai_powered": False,
        "note": "AI not configured. Set OPENAI_API_KEY for auto-classification.",
    }


def check_data_quality(data_summary: str) -> dict:
    """AI-powered data quality check for anomalies and patterns."""
    result = _chat(
        system_prompt=(
            "You are a humanitarian data quality analyst. Analyze the data summary and return JSON with: "
            "quality_score (0-100), anomalies (list of {field, issue, severity}), "
            "recommendations (list of strings), duplicate_risk (low/medium/high)."
        ),
        user_content=data_summary,
    )
    if result:
        result["ai_powered"] = True
        return result
    return {
        "quality_score": 0,
        "anomalies": [],
        "recommendations": ["Enable AI for automated data quality checks"],
        "duplicate_risk": "unknown",
        "ai_powered": False,
    }


def generate_narrative_report(
    project_name: str, indicators_summary: str, period: str,
) -> dict:
    """Generate a narrative report from indicators data."""
    result = _chat(
        system_prompt=(
            "You are a humanitarian report writer. Generate a professional narrative report "
            "suitable for donor reporting. Return JSON with: executive_summary (string), "
            "achievements (list of strings), challenges (list of strings), "
            "lessons_learned (list of strings), next_steps (list of strings)."
        ),
        user_content=(
            f"Project: {project_name}\nPeriod: {period}\n"
            f"Indicators Summary:\n{indicators_summary}"
        ),
        max_tokens=2000,
    )
    if result:
        result["ai_powered"] = True
        return result
    return {
        "executive_summary": f"Report for {project_name} ({period}). AI not configured.",
        "achievements": [],
        "challenges": [],
        "lessons_learned": [],
        "next_steps": [],
        "ai_powered": False,
    }
