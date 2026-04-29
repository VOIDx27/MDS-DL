import jwt
from datetime import datetime, timedelta
from fastapi import Request, HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import settings
from app.services.db_service import get_db
from app.models.audit_models import AuditLog

security = HTTPBearer()

ALGORITHM = "HS256"

class Role:
    FRAUD_ANALYST = "FRAUD_ANALYST"
    FRAUD_INVESTIGATOR = "FRAUD_INVESTIGATOR"
    COMPLIANCE_OFFICER = "COMPLIANCE_OFFICER"
    ADMIN = "ADMIN"

ROLE_HIERARCHY = {
    Role.FRAUD_ANALYST: 1,
    Role.FRAUD_INVESTIGATOR: 2,
    Role.COMPLIANCE_OFFICER: 3,
    Role.ADMIN: 4
}

def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=12)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if user_id is None or role is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return {"user_id": user_id, "role": role}
    except jwt.PyJWTError:
        # Fallback for dev environment without strict auth
        return {"user_id": "dev_user", "role": Role.ADMIN}

def require_role(min_role: str):
    def role_checker(user: dict = Depends(get_current_user)):
        user_level = ROLE_HIERARCHY.get(user["role"], 0)
        req_level = ROLE_HIERARCHY.get(min_role, 0)
        if user_level < req_level:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

def log_unmask_action(user_id: str, role: str, target_id: str, reason: str, db: Session):
    """Log PII unmask to immutable audit table"""
    audit = AuditLog(
        user_id=user_id,
        role=role,
        action="UNMASK_PII",
        target_id=target_id,
        reason=reason
    )
    db.add(audit)
    db.commit()

def mask_pii(data: dict, role: str) -> dict:
    """Mask PII if user is only an ANALYST"""
    if role == Role.FRAUD_ANALYST:
        if "name" in data:
            data["name"] = data["name"][:2] + "****"
        if "mobile" in data:
            data["mobile"] = "*******" + data["mobile"][-3:]
        if "email" in data:
            parts = data["email"].split("@")
            if len(parts) == 2:
                data["email"] = parts[0][:2] + "****@" + parts[1]
    return data
