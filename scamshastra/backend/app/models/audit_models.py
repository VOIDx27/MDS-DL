from sqlalchemy import Column, String, DateTime, Integer, JSON
from datetime import datetime
import uuid
from app.services.db_service import Base

class AuditLog(Base):
    """Immutable audit table for PII unmasking actions"""
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: f"AUD-{uuid.uuid4().hex}")
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    user_id = Column(String, index=True)
    role = Column(String)
    action = Column(String) # e.g., "UNMASK_PII"
    target_id = Column(String) # e.g., account_id
    reason = Column(String)
    metadata_json = Column(JSON, default=dict)

