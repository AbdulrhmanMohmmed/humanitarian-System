from enum import StrEnum
from typing import Iterable

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.models.enums import UserRole


class Permission(StrEnum):
    USERS_READ = "users.read"
    USERS_CREATE = "users.create"
    USERS_UPDATE = "users.update"
    USERS_DELETE = "users.delete"

    PROJECTS_READ = "projects.read"
    PROJECTS_WRITE = "projects.write"
    BENEFICIARIES_READ = "beneficiaries.read"
    BENEFICIARIES_WRITE = "beneficiaries.write"
    BENEFICIARIES_DELETE = "beneficiaries.delete"

    FINANCE_READ = "finance.read"
    FINANCE_WRITE = "finance.write"
    HR_READ = "hr.read"
    HR_WRITE = "hr.write"
    INVENTORY_READ = "inventory.read"
    INVENTORY_WRITE = "inventory.write"

    MEAL_READ = "meal.read"
    MEAL_WRITE = "meal.write"
    CFM_READ = "cfm.read"
    CFM_SENSITIVE_READ = "cfm.sensitive.read"
    CFM_WRITE = "cfm.write"
    SAFEGUARDING_READ = "safeguarding.read"
    SAFEGUARDING_WRITE = "safeguarding.write"

    REPORTS_READ = "reports.read"
    REPORTS_WRITE = "reports.write"
    REPORTS_EXPORT = "reports.export"
    AUDIT_READ = "audit.read"
    SETTINGS_MANAGE = "settings.manage"


PROGRAM_PERMISSIONS = {
    Permission.PROJECTS_READ,
    Permission.PROJECTS_WRITE,
    Permission.BENEFICIARIES_READ,
    Permission.BENEFICIARIES_WRITE,
    Permission.INVENTORY_READ,
    Permission.MEAL_READ,
    Permission.MEAL_WRITE,
    Permission.CFM_READ,
    Permission.CFM_WRITE,
    Permission.REPORTS_READ,
    Permission.REPORTS_WRITE,
    Permission.REPORTS_EXPORT,
}

FIELD_PERMISSIONS = {
    Permission.PROJECTS_READ,
    Permission.BENEFICIARIES_READ,
    Permission.BENEFICIARIES_WRITE,
    Permission.INVENTORY_READ,
    Permission.MEAL_READ,
    Permission.CFM_READ,
    Permission.CFM_WRITE,
}

FINANCE_PERMISSIONS = {
    Permission.PROJECTS_READ,
    Permission.FINANCE_READ,
    Permission.FINANCE_WRITE,
    Permission.REPORTS_READ,
    Permission.REPORTS_EXPORT,
}

HR_PERMISSIONS = {
    Permission.HR_READ,
    Permission.HR_WRITE,
    Permission.REPORTS_READ,
}

VIEWER_PERMISSIONS = {
    Permission.PROJECTS_READ,
    Permission.BENEFICIARIES_READ,
    Permission.MEAL_READ,
    Permission.REPORTS_READ,
}

ROLE_PERMISSIONS: dict[str, set[Permission]] = {
    UserRole.ADMIN.value: set(Permission),
    UserRole.MANAGER.value: PROGRAM_PERMISSIONS | {Permission.CFM_SENSITIVE_READ},
    "program_manager": PROGRAM_PERMISSIONS | {Permission.CFM_SENSITIVE_READ},
    "meal_officer": PROGRAM_PERMISSIONS | {Permission.SAFEGUARDING_READ},
    UserRole.FIELD_OFFICER.value: FIELD_PERMISSIONS,
    UserRole.FINANCE.value: FINANCE_PERMISSIONS,
    UserRole.HR.value: HR_PERMISSIONS,
    UserRole.VIEWER.value: VIEWER_PERMISSIONS,
}


def normalize_role(role) -> str:
    if hasattr(role, "value"):
        return role.value
    return str(role or UserRole.VIEWER.value)


def permissions_for_role(role, db: Session | None = None) -> set[Permission]:
    permissions = set(ROLE_PERMISSIONS.get(normalize_role(role), VIEWER_PERMISSIONS))
    if db is None:
        return permissions

    from app.models import RolePermissionOverride

    overrides = db.query(RolePermissionOverride).filter(RolePermissionOverride.role == normalize_role(role)).all()
    for override in overrides:
        try:
            permission = Permission(override.permission)
        except ValueError:
            continue
        if override.effect == "allow":
            permissions.add(permission)
        elif override.effect == "deny":
            permissions.discard(permission)
    return permissions


def permission_values_for_user(user: User, db: Session | None = None) -> list[str]:
    return sorted(permission.value for permission in permissions_for_role(user.role, db))


def user_has_permission(user: User, permission: Permission | str, db: Session | None = None) -> bool:
    try:
        requested = Permission(permission)
    except ValueError:
        return False
    return requested in permissions_for_role(user.role, db)


def require_permission(*permissions: Permission | str, any_of: bool = False):
    from app.auth import get_current_user

    required = [Permission(permission) for permission in permissions]

    def dependency(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
        granted = permissions_for_role(current_user.role, db)
        allowed = any(permission in granted for permission in required) if any_of else all(
            permission in granted for permission in required
        )
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return current_user

    return dependency


def roles_catalog() -> list[dict[str, Iterable[str]]]:
    return [
        {"role": role, "permissions": sorted(permission.value for permission in permissions)}
        for role, permissions in sorted(ROLE_PERMISSIONS.items())
    ]
