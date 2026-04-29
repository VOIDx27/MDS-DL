"""
Entity endpoints — Users, Accounts, Devices.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/entities", tags=["entities"])


@router.get("/health")
def entities_health():
    return {"status": "ok"}
