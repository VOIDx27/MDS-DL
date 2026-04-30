"""
Graph analytics endpoints — mule ring detection, shortest paths, clustering.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/graph", tags=["graph"])


@router.get("/health")
def graph_health():
    return {"status": "ok"}

