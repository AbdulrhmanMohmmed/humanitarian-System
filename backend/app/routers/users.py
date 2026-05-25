from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone

from app.database import get_db
from app.models import User
from app.models.enums import UserRole
from app.auth import get_current_user, get_password_hash, validate_password_strength
from app.permissions import Permission, require_permission, permissions_for_role

router = APIRouter(prefix="/users", tags=["إدارة المستخدمين"])


class UserCreateBody(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    role: str = "viewer"
    phone: Optional[str] = None
    department: Optional[str] = None
    is_active: bool = True


class UserUpdateBody(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    phone: Optional[str] = None
    department: Optional[str] = None
    permissions: list[str] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


def to_user_out(user: User, db: Session) -> dict:
    role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)
    perms = sorted(p.value for p in permissions_for_role(user.role, db))
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "role": role_str,
        "is_active": user.is_active,
        "phone": user.phone,
        "department": user.department,
        "permissions": perms,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }


@router.get("/", response_model=List[UserOut])
def list_users(
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USERS_READ)),
):
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    if is_active is not None:
        q = q.filter(User.is_active == is_active)
    if search:
        q = q.filter(
            (User.username.ilike(f"%{search}%"))
            | (User.full_name.ilike(f"%{search}%"))
            | (User.email.ilike(f"%{search}%"))
        )
    users = q.order_by(User.created_at.desc()).all()
    return [to_user_out(u, db) for u in users]


@router.get("/stats")
def user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USERS_READ)),
):
    total = db.query(User).count()
    active = db.query(User).filter(User.is_active == True).count()
    by_role = {}
    for role in UserRole:
        count = db.query(User).filter(User.role == role).count()
        if count > 0:
            by_role[role.value] = count
    return {
        "total": total,
        "active": active,
        "inactive": total - active,
        "by_role": by_role,
    }


@router.post("/", response_model=UserOut)
def create_user(
    body: UserCreateBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USERS_CREATE)),
):
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=400, detail="اسم المستخدم موجود بالفعل")
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="البريد الإلكتروني مسجل بالفعل")

    is_valid, error_msg = validate_password_strength(body.password)
    if not is_valid:
        raise HTTPException(status_code=422, detail=error_msg)

    user = User(
        username=body.username,
        email=body.email,
        full_name=body.full_name,
        hashed_password=get_password_hash(body.password),
        role=body.role,
        phone=body.phone,
        department=body.department,
        is_active=body.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return to_user_out(user, db)


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USERS_READ)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    return to_user_out(user, db)


@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    body: UserUpdateBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USERS_UPDATE)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")

    if body.full_name is not None:
        user.full_name = body.full_name
    if body.email is not None:
        existing = db.query(User).filter(User.email == body.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="البريد الإلكتروني مسجل بالفعل")
        user.email = body.email
    if body.role is not None:
        user.role = body.role
    if body.phone is not None:
        user.phone = body.phone
    if body.department is not None:
        user.department = body.department
    if body.is_active is not None:
        if user_id == current_user.id and not body.is_active:
            raise HTTPException(status_code=400, detail="لا يمكنك تعطيل حسابك الخاص")
        user.is_active = body.is_active

    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return to_user_out(user, db)


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USERS_DELETE)),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="لا يمكنك حذف حسابك الخاص")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    db.delete(user)
    db.commit()
    return {"message": "تم حذف المستخدم بنجاح"}


@router.put("/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.USERS_UPDATE)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    temp_password = "Hiaos@2026!"
    user.hashed_password = get_password_hash(temp_password)
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "تم إعادة تعيين كلمة المرور", "temp_password": temp_password}
