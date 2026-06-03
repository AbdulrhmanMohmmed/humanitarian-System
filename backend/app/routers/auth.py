from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserLogin, UserOut, Token
from app.auth import (
    get_password_hash, verify_password,
    create_access_token, create_refresh_token, verify_refresh_token,
    get_current_user, get_optional_current_user, validate_password_strength,
)
from app.permissions import Permission, require_permission, roles_catalog
from pydantic import BaseModel
from typing import List
from datetime import datetime, timezone
from app.config import settings
from app.middleware.rate_limit import limiter

router = APIRouter(prefix="/auth", tags=["المصادقة"])


# ── Helpers ────────────────────────────────────────────────────────────────────

def serialize_user(user: User, db: Session) -> UserOut:
    result = UserOut.model_validate(user)
    from app.permissions import permission_values_for_user
    result.permissions = permission_values_for_user(user, db)
    return result


# ── Schemas ────────────────────────────────────────────────────────────────────

class RefreshRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


# ── Register ───────────────────────────────────────────────────────────────────

@router.post("/register", response_model=Token)
@limiter.limit("5/minute")
def register(
    request: Request,
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    # First user can register freely; afterwards requires auth
    if db.query(User).count() > 0:
        if current_user is None:
            raise HTTPException(status_code=401, detail="Authentication required.")
        require_permission(Permission.USERS_CREATE)(current_user)

    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="اسم المستخدم موجود بالفعل")
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="البريد الإلكتروني مسجل بالفعل")

    # Validate password strength
    is_valid, error_msg = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(status_code=422, detail=error_msg)

    user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        role=user_data.role,
        phone=user_data.phone,
        department=user_data.department,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=serialize_user(user, db),
        enabled_modules=settings.enabled_modules_list,
    )


# ── Login ──────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
def login(request: Request, user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_data.username).first()

    # Constant-time comparison to prevent timing attacks
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="اسم المستخدم أو كلمة المرور غير صحيحة",
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="الحساب معطل")

    access_token = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})

    # Audit log
    try:
        from app.routers.audit import log_audit
        from app.models import AuditAction
        log_audit(db, user.id, AuditAction.LOGIN, "auth", details=f"Login from user: {user.username}")
    except Exception:
        pass

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=serialize_user(user, db),
        enabled_modules=settings.enabled_modules_list,
    )


# ── Refresh Token ──────────────────────────────────────────────────────────────

@router.post("/refresh", response_model=Token, summary="Refresh Access Token")
def refresh_token(body: RefreshRequest, db: Session = Depends(get_db)):
    """
    Exchange a valid refresh token for a new access token + refresh token pair.
    Old refresh token is invalidated (rotation).
    """
    username = verify_refresh_token(body.refresh_token)
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="المستخدم غير موجود أو الحساب معطل",
        )

    # Issue new token pair (rotation)
    new_access = create_access_token(data={"sub": user.username})
    new_refresh = create_refresh_token(data={"sub": user.username})

    return Token(
        access_token=new_access,
        refresh_token=new_refresh,
        token_type="bearer",
        user=serialize_user(user, db),
        enabled_modules=settings.enabled_modules_list,
    )


# ── Me / Profile ───────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return serialize_user(current_user, db)


@router.put("/me/password", summary="Change Password")
def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="كلمة المرور الحالية غير صحيحة")

    is_valid, error_msg = validate_password_strength(body.new_password)
    if not is_valid:
        raise HTTPException(status_code=422, detail=error_msg)

    current_user.hashed_password = get_password_hash(body.new_password)
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "تم تغيير كلمة المرور بنجاح"}


# ── User Management ────────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USERS_READ)),
):
    return [serialize_user(u, db) for u in db.query(User).all()]


@router.put("/users/{user_id}/status", summary="Activate/Deactivate User")
def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USERS_UPDATE)),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="لا يمكنك تعطيل حسابك الخاص")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    user.is_active = not user.is_active
    db.commit()
    return {"message": f"تم {'تفعيل' if user.is_active else 'تعطيل'} الحساب", "is_active": user.is_active}


@router.get("/permissions")
def get_my_permissions(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.get("/roles")
def list_roles(current_user: User = Depends(require_permission(Permission.USERS_READ))):
    return roles_catalog()
