"""
Transaction endpoints — query, filter, and paginate UPI transactions.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/transactions", tags=["transactions"])


@router.get("/health")
def transactions_health():
    return {"status": "ok"}
