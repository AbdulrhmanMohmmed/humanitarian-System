"""Livelihoods Module endpoints."""
from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.models.new_modules import LivelihoodProgram
from app.pagination import PaginationParams, paginate

router = APIRouter(prefix="/livelihoods", tags=["سبل العيش"])


class ProgramCreate(BaseModel):
    name: str
    program_type: str = "vocational_training"
    project_id: Optional[int] = None
    target_beneficiaries: int = 0
    budget: float = 0


@router.post("/programs")
def create_program(body: ProgramCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prog = LivelihoodProgram(**body.model_dump())
    db.add(prog)
    db.commit()
    return {"id": prog.id, "name": prog.name}


@router.get("/programs")
def list_programs(
    program_type: Optional[str] = None,
    params: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(LivelihoodProgram)
    if program_type:
        query = query.filter(LivelihoodProgram.program_type == program_type)
    return paginate(query.order_by(LivelihoodProgram.created_at.desc()), params)
