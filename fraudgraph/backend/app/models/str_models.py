from sqlalchemy import Column, String, DateTime, Integer, JSON, Text
from datetime import datetime
import uuid
from app.services.db_service import Base

class STRRecord(Base):
    __tablename__ = "str_records"

    id = Column(String, primary_key=True, default=lambda: f"STR-{uuid.uuid4().hex[:8].upper()}")
    fiu_reference = Column(String, unique=True, index=True)
    reporting_date = Column(DateTime, default=datetime.utcnow)
    reporting_entity = Column(String, default="FraudGraph Bank Ltd.")
    
    # JSON arrays
    account_ids = Column(JSON, default=list)
    path_ids = Column(JSON, default=list)
    
    trigger_type = Column(String) # AUTO or MANUAL
    
    # Summary
    total_amount = Column(Integer, default=0)
    hop_count = Column(Integer, default=0)
    risk_narrative = Column(Text)
    
    # Analyst Info
    assigned_to = Column(String, default="Unassigned")
    status = Column(String, default="DRAFT") # DRAFT | PENDING_APPROVAL | SUBMITTED
    
    pdf_path = Column(String, nullable=True)
