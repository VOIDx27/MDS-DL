"""
Pydantic models for scoring engine requests and responses.

Every response includes the composite score AND the full signal breakdown
so investigators can see exactly why an account/path/ring was flagged.
"""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ═══════════════════════════════════════════════════════════════════════════════
# Enums
# ═══════════════════════════════════════════════════════════════════════════════

class MPSVerdict(str, Enum):
    CLEAR           = "CLEAR"
    FLAG_FOR_REVIEW = "FLAG_FOR_REVIEW"
    AUTO_ALERT      = "AUTO_ALERT"


class LRSVerdict(str, Enum):
    CLEAR              = "CLEAR"
    POTENTIAL_LAYERING = "POTENTIAL_LAYERING"
    CONFIRMED_LAYERING = "CONFIRMED_LAYERING"


class RingClassification(str, Enum):
    MICRO  = "MICRO"
    SMALL  = "SMALL"
    MEDIUM = "MEDIUM"
    LARGE  = "LARGE"


# ═══════════════════════════════════════════════════════════════════════════════
# MPS — Mule Probability Score
# ═══════════════════════════════════════════════════════════════════════════════

class SignalDetail(BaseModel):
    """Individual signal with its raw value, weight, and weighted contribution."""
    name: str
    raw_score: float = Field(ge=0.0, le=1.0, description="Signal score before weighting")
    weight: float = Field(ge=0.0, le=1.0, description="Weight in composite formula")
    weighted_score: float = Field(ge=0.0, le=1.0, description="raw_score × weight")
    explanation: str = Field(description="Human-readable explanation of the signal")


class MPSResponse(BaseModel):
    """Full response for POST /api/score/account/{account_id}."""
    account_id: str
    vpa: str
    mule_probability_score: float = Field(ge=0.0, le=1.0, alias="mps")
    verdict: MPSVerdict
    signals: list[SignalDetail]
    flagged_at: Optional[datetime] = None
    metadata: dict = Field(default_factory=dict)


# ═══════════════════════════════════════════════════════════════════════════════
# LRS — Layering Risk Score
# ═══════════════════════════════════════════════════════════════════════════════

class PathHop(BaseModel):
    """One hop in a transaction path."""
    from_vpa: str
    to_vpa: str
    amount: float
    bank: str
    city: str
    state: str
    timestamp: datetime
    hold_minutes: Optional[float] = Field(
        None, description="Minutes this node held funds before forwarding"
    )


class PathScoreRequest(BaseModel):
    """Request body for POST /api/score/path."""
    source_id: str = Field(description="Source Account id or VPA")
    target_id: str = Field(description="Target Account id or VPA")


class LRSSignals(BaseModel):
    """Individual LRS signal scores."""
    hop_score: float = Field(ge=0.0, le=1.0)
    velocity_score: float = Field(ge=0.0, le=1.0)
    bank_diversity_score: float = Field(ge=0.0, le=1.0)
    geo_diversity_score: float = Field(ge=0.0, le=1.0)


class LRSResponse(BaseModel):
    """Full response for POST /api/score/path."""
    source_id: str
    target_id: str
    layering_risk_score: float = Field(ge=0.0, le=1.0, alias="lrs")
    verdict: LRSVerdict
    hop_count: int
    path: list[PathHop]
    signals: LRSSignals
    metadata: dict = Field(default_factory=dict)


# ═══════════════════════════════════════════════════════════════════════════════
# Ring Detection
# ═══════════════════════════════════════════════════════════════════════════════

class RingMember(BaseModel):
    """Summary of a ring member account."""
    account_id: str
    vpa: str
    mule_score: float
    bank: str
    is_flagged: bool


class DetectedRing(BaseModel):
    """A single detected fraud ring."""
    ring_id: str
    community_id: int = Field(description="Louvain community ID")
    classification: RingClassification
    member_count: int
    flagged_count: int
    flagged_percent: float = Field(ge=0.0, le=1.0)
    intra_ring_density: float = Field(description="Transactions per member pair vs baseline")
    estimated_value: float = Field(description="Total INR volume within the ring")
    activation_window_hours: Optional[float] = Field(
        None, description="Hours between first and last intra-ring txn"
    )
    ring_score: float = Field(ge=0.0, le=1.0, description="Composite ring suspicion score")
    members: list[RingMember]


class RingDetectionResponse(BaseModel):
    """Full response for POST /api/rings/detect."""
    total_communities: int
    suspicious_rings: int
    rings: list[DetectedRing]
    metadata: dict = Field(default_factory=dict)
