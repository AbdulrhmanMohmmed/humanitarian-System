from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/ai", tags=["AI Hub"])

@router.post("/analyze-proposal")
def analyze_proposal(text: str, current_user: User = Depends(get_current_user)):
    # Mock AI logic
    return {
        "summary": "This proposal focuses on WASH activities in rural areas of Hodeidah.",
        "suggested_indicators": [
            {"name": "Number of people reached with clean water", "target": 5000},
            {"name": "Number of latrines constructed", "target": 200}
        ],
        "risk_factors": ["High inflation affecting material costs", "Seasonal flooding risks"],
        "estimated_budget_accuracy": "85% (High)"
    }

@router.post("/draft-report")
def draft_report(project_id: int, db: Session = Depends(get_db)):
    # Mock AI logic
    return {
        "report_draft": "During the reporting period, the project achieved 75% of its targets. Key successes include the completion of 3 water networks. Challenges included logistical delays at the port.",
        "sentiment_analysis": "Positive with minor operational concerns",
        "recommended_actions": ["Accelerate procurement for Phase 2", "Increase community engagement in district X"]
    }
