"""
FraudGraph — Shared Python Schemas (Pydantic v2)

Canonical Pydantic models shared across backend, stream-processor, and simulation.
"""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ─── Enums ────────────────────────────────────────────

class KYCStatus(str, Enum):
    VERIFIED = "verified"
    PENDING = "pending"
    REJECTED = "rejected"


class TransactionStatus(str, Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    PENDING = "PENDING"
    REVERSED = "REVERSED"


class TransactionType(str, Enum):
    P2P = "P2P"
    P2M = "P2M"
    COLLECT = "COLLECT"
    MANDATE = "MANDATE"


class AlertSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class CaseStatus(str, Enum):
    OPEN = "OPEN"
    INVESTIGATING = "INVESTIGATING"
    ESCALATED = "ESCALATED"
    CLOSED = "CLOSED"


# ─── Entity Schemas ───────────────────────────────────

class UserSchema(BaseModel):
    id: str
    name: str
    phone: str
    vpa: str = Field(description="UPI Virtual Payment Address")
    kyc_status: KYCStatus
    risk_score: float = Field(ge=0.0, le=1.0)
    created_at: datetime


class AccountSchema(BaseModel):
    account_number: str
    ifsc: str
    bank_name: str
    user_id: str
    balance: float
    is_frozen: bool = False
    created_at: datetime


class DeviceSchema(BaseModel):
    id: str
    user_id: str
    fingerprint: str
    ip_address: str
    last_seen: datetime


# ─── Transaction Schema ──────────────────────────────

class TransactionSchema(BaseModel):
    id: str
    sender_vpa: str
    receiver_vpa: str
    amount: float = Field(gt=0)
    currency: str = "INR"
    type: TransactionType
    status: TransactionStatus
    rrn: str = Field(description="Retrieval Reference Number")
    timestamp: datetime
    remarks: Optional[str] = None


# ─── Alert / Case Schemas ────────────────────────────

class AlertSchema(BaseModel):
    id: str
    type: str
    severity: AlertSeverity
    description: str
    related_entity_ids: list[str] = []
    created_at: datetime


class CaseSchema(BaseModel):
    id: str
    title: str
    status: CaseStatus
    assignee: str
    alert_ids: list[str] = []
    str_filed: bool = False
    created_at: datetime
    updated_at: datetime
