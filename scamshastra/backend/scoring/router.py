"""
Scoring Engine — FastAPI Router
════════════════════════════════

Three POST endpoints:
  POST /api/score/account/{account_id}  → MPS + signal breakdown
  POST /api/score/path                  → LRS + hop chain
  POST /api/rings/detect                → Louvain ring detection
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from neo4j import Session

from app.services.neo4j_service import get_neo4j_session
from scoring.models import (
    MPSResponse,
    LRSResponse,
    PathScoreRequest,
    RingDetectionResponse,
)
from scoring.mule_score import compute_mps
from scoring.layering_score import compute_lrs
from scoring.ring_detection import detect_rings

router = APIRouter(tags=["scoring"])


# ═══════════════════════════════════════════════════════════════════════════════
# POST /api/score/account/{account_id}
# ═══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/api/score/account/{account_id}",
    response_model=MPSResponse,
    summary="Compute Mule Probability Score",
    description=(
        "Calculates the MPS for a single account across five weighted signals: "
        "VelocityScore, PassThroughScore, TopologyScore, AgeVolumeScore, DeviceScore. "
        "Persists the updated muleScore back to the Account node in Neo4j."
    ),
)
def score_account(
    account_id: str,
    session: Session = Depends(get_neo4j_session),
) -> MPSResponse:
    try:
        result = compute_mps(session, account_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring engine error: {e}")
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# POST /api/score/path
# ═══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/api/score/path",
    response_model=LRSResponse,
    summary="Compute Layering Risk Score",
    description=(
        "Finds transaction paths between source and target accounts, then "
        "scores the best path for layering behaviour using four multiplicative "
        "signals: HopScore, VelocityScore, BankDiversityScore, GeoDiversityScore."
    ),
)
def score_path(
    request: PathScoreRequest,
    session: Session = Depends(get_neo4j_session),
) -> LRSResponse:
    try:
        result = compute_lrs(session, request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring engine error: {e}")
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# POST /api/rings/detect
# ═══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/api/rings/detect",
    response_model=RingDetectionResponse,
    summary="Detect Fraud Rings via Louvain",
    description=(
        "Projects the Account→SENT graph into Neo4j GDS, runs Louvain "
        "community detection, scores each community for fraud-ring indicators "
        "(density, flagged %, activation window), and returns suspicious rings."
    ),
)
def detect_fraud_rings(
    session: Session = Depends(get_neo4j_session),
) -> RingDetectionResponse:
    try:
        result = detect_rings(session)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ring detection error: {e}")
    return result

