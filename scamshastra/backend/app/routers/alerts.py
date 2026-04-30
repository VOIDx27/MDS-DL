"""
Alert & case management endpoints — STR filing, RBI reporting hooks.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])


@router.get("/health")
def alerts_health():
    return {"status": "ok"}

