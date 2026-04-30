from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import uuid
import os
from datetime import datetime

from app.services.db_service import get_db
from app.services.neo4j_service import get_neo4j_session
from app.models.str_models import STRRecord
from app.services.pdf_service import generate_str_pdf

router = APIRouter(prefix="/api/compliance", tags=["compliance"])

class STRGenerateRequest(BaseModel):
    account_ids: List[str]
    path_ids: List[str] = []
    trigger: str = "AUTO" # AUTO | MANUAL

class STRGenerateResponse(BaseModel):
    str_id: str
    fiu_reference: str
    status: str
    pdf_url: str
    message: str

@router.post("/str/generate", response_model=STRGenerateResponse)
def generate_str(
    request: STRGenerateRequest,
    db: Session = Depends(get_db),
    neo4j_session = Depends(get_neo4j_session)
):
    if not request.account_ids:
        raise HTTPException(status_code=400, detail="At least one account ID is required")
        
    # 1. Fetch account details from Neo4j
    q_accounts = """
    MATCH (a:Account)
    WHERE a.id IN $account_ids
    RETURN a.id AS id, a.vpa AS vpa, a.bank AS bank, a.kycTier AS kycTier, a.muleScore AS muleScore
    """
    accounts_data = [record.data() for record in neo4j_session.run(q_accounts, account_ids=request.account_ids)]
    
    if not accounts_data:
        raise HTTPException(status_code=404, detail="No accounts found in Neo4j for the provided IDs")
    
    # 2. Fetch transaction details (edges between these accounts) to compute total amount and hops
    q_txns = """
    MATCH (a:Account)-[r:SENT]->(b:Account)
    WHERE a.id IN $account_ids AND b.id IN $account_ids
    RETURN sum(r.amount) AS total_amount, count(r) AS hop_count
    """
    txn_data = neo4j_session.run(q_txns, account_ids=request.account_ids).single()
    
    total_amount = int(txn_data["total_amount"] or 0) if txn_data else 0
    hop_count = int(txn_data["hop_count"] or 0) if txn_data else 0
    
    # 3. Generate Narrative
    narrative = f"This report is filed regarding a network of {len(accounts_data)} accounts exhibiting suspicious behavior."
    if request.trigger == "AUTO":
        narrative += " Automated systems flagged these accounts due to elevated Mule Probability Scores (MPS) "
        narrative += "and rapid pass-through velocity indicative of layering."
    else:
        narrative += " An analyst manually escalated this case after identifying anomalies in the transaction graph."
        
    if hop_count > 0:
        narrative += f" A total of {hop_count} transactions were observed between these subjects, aggregating to ₹{total_amount:,}."
    
    # 4. Create DB Record
    fiu_ref = f"FIU-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    str_record = STRRecord(
        fiu_reference=fiu_ref,
        account_ids=request.account_ids,
        path_ids=request.path_ids,
        trigger_type=request.trigger,
        total_amount=total_amount,
        hop_count=hop_count,
        risk_narrative=narrative,
        status="DRAFT"
    )
    
    db.add(str_record)
    db.commit()
    db.refresh(str_record)
    
    # 5. Generate PDF
    pdf_filename = f"{str_record.id}.pdf"
    pdf_dir = os.path.join(os.getcwd(), "exports", "strs")
    pdf_path = os.path.join(pdf_dir, pdf_filename)
    
    report_data = {
        "fiu_reference": str_record.fiu_reference,
        "reporting_date": str_record.reporting_date.strftime("%Y-%m-%d %H:%M:%S UTC"),
        "reporting_entity": str_record.reporting_entity,
        "subject_accounts": accounts_data,
        "total_amount": str_record.total_amount,
        "hop_count": str_record.hop_count,
        "trigger_type": str_record.trigger_type,
        "risk_narrative": str_record.risk_narrative,
        "status": str_record.status,
        "assigned_to": str_record.assigned_to
    }
    
    generate_str_pdf(report_data, pdf_path)
    
    str_record.pdf_path = pdf_path
    db.commit()
    
    return STRGenerateResponse(
        str_id=str_record.id,
        fiu_reference=str_record.fiu_reference,
        status=str_record.status,
        pdf_url=f"/api/compliance/str/download/{str_record.id}",
        message="STR Draft generated successfully"
    )

from fastapi.responses import FileResponse

@router.get("/str/download/{str_id}")
def download_str_pdf(str_id: str, db: Session = Depends(get_db)):
    str_record = db.query(STRRecord).filter(STRRecord.id == str_id).first()
    if not str_record or not str_record.pdf_path or not os.path.exists(str_record.pdf_path):
        raise HTTPException(status_code=404, detail="PDF not found")
        
    return FileResponse(
        str_record.pdf_path, 
        media_type='application/pdf',
        filename=f"{str_record.fiu_reference}.pdf"
    )

