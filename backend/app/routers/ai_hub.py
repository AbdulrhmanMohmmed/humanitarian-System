from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.config import settings
from app.models.user import User
from app.models.project import Project

router = APIRouter(prefix="/ai", tags=["AI Hub"])


class ProposalAnalysisRequest(BaseModel):
    text: str


class ReportDraftRequest(BaseModel):
    project_id: int
    report_type: str = "progress"


@router.post("/analyze-proposal")
def analyze_proposal(
    body: ProposalAnalysisRequest,
    current_user: User = Depends(get_current_user),
):
    if settings.AI_ENABLED:
        try:
            import openai

            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                max_tokens=settings.OPENAI_MAX_TOKENS,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a humanitarian proposal analyst. Analyze the proposal "
                            "and return JSON with: summary, suggested_indicators (list of "
                            "{name, target}), risk_factors (list of strings), "
                            "estimated_budget_accuracy (string)."
                        ),
                    },
                    {"role": "user", "content": body.text},
                ],
            )
            import json

            content = response.choices[0].message.content
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                return {"raw_analysis": content, "ai_powered": True}
        except Exception as e:
            raise HTTPException(
                status_code=503,
                detail=f"AI service error: {e}. Falling back to mock response.",
            )

    return {
        "summary": "AI is not configured. Set OPENAI_API_KEY to enable real analysis.",
        "suggested_indicators": [],
        "risk_factors": [],
        "estimated_budget_accuracy": "N/A",
        "ai_powered": False,
    }


@router.post("/draft-report")
def draft_report(
    body: ReportDraftRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == body.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project_context = (
        f"Project: {project.name}, Sector: {project.sector}, "
        f"Status: {project.status}, Budget: {project.budget}, "
        f"Spent: {project.spent}"
    )

    if settings.AI_ENABLED:
        try:
            import openai

            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                max_tokens=settings.OPENAI_MAX_TOKENS,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a humanitarian report writer. Draft a concise "
                            f"{body.report_type} report based on the project data. "
                            "Return JSON with: report_draft, key_achievements, challenges, "
                            "recommended_actions (list of strings)."
                        ),
                    },
                    {"role": "user", "content": project_context},
                ],
            )
            import json

            content = response.choices[0].message.content
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                return {"report_draft": content, "ai_powered": True}
        except Exception as e:
            raise HTTPException(
                status_code=503,
                detail=f"AI service error: {e}. Falling back to mock response.",
            )

    budget_utilization = (
        round(project.spent / project.budget * 100) if project.budget else 0
    )
    return {
        "report_draft": (
            f"Project '{project.name}' in the {project.sector} sector "
            f"is currently {project.status}. Budget utilization is at "
            f"{budget_utilization}%."
        ),
        "key_achievements": [],
        "challenges": [],
        "recommended_actions": [],
        "ai_powered": False,
        "note": "AI is not configured. Set OPENAI_API_KEY to enable real report generation.",
    }
