"""MFA/TOTP endpoints — setup, confirm, verify, disable."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.services import mfa_service

router = APIRouter(prefix="/mfa", tags=["المصادقة الثنائية"])


class TOTPCode(BaseModel):
    code: str


@router.post("/setup")
def setup_mfa(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = mfa_service.setup_mfa(db, current_user.id)
    uri = mfa_service.get_totp_uri(result["secret"], current_user.username)
    return {"secret": result["secret"], "qr_uri": uri, "backup_codes": result["backup_codes"]}


@router.post("/confirm")
def confirm_mfa(body: TOTPCode, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not mfa_service.confirm_mfa(db, current_user.id, body.code):
        raise HTTPException(400, "رمز غير صحيح")
    return {"message": "تم تفعيل المصادقة الثنائية بنجاح"}


@router.post("/disable")
def disable_mfa(body: TOTPCode, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not mfa_service.verify_mfa_login(db, current_user.id, body.code):
        raise HTTPException(400, "رمز غير صحيح")
    mfa_service.disable_mfa(db, current_user.id)
    return {"message": "تم إلغاء المصادقة الثنائية"}


@router.get("/status")
def mfa_status(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"mfa_enabled": mfa_service.is_mfa_enabled(db, current_user.id)}
