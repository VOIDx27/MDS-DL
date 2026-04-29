import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_str_pdf(str_record: dict, filepath: str):
    """
    Generate a formatted PDF for the STR Record.
    """
    # Ensure directory exists
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    doc = SimpleDocTemplate(filepath, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.darkblue,
        spaceAfter=14
    )
    
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.gray,
        spaceAfter=12
    )
    
    narrative_style = ParagraphStyle(
        'NarrativeStyle',
        parent=styles['Normal'],
        fontSize=11,
        leading=16,
        spaceAfter=14
    )

    story = []
    
    # Header
    story.append(Paragraph("SUSPICIOUS TRANSACTION REPORT (STR)", title_style))
    story.append(Paragraph(f"<b>FIU-IND Reference:</b> {str_record.get('fiu_reference')}", header_style))
    story.append(Paragraph(f"<b>Reporting Date:</b> {str_record.get('reporting_date')}", header_style))
    story.append(Paragraph(f"<b>Reporting Entity:</b> {str_record.get('reporting_entity')}", header_style))
    story.append(Spacer(1, 12))
    
    # Subject Accounts Table
    story.append(Paragraph("<b>Subject Accounts</b>", styles['Heading2']))
    
    account_data = [["VPA (Masked)", "Bank", "KYC Tier", "MPS Score"]]
    for acc in str_record.get("subject_accounts", []):
        vpa = acc.get("vpa", "")
        # mask vpa
        masked_vpa = vpa[:3] + "****" + vpa[-4:] if len(vpa) > 7 else "****"
        account_data.append([
            masked_vpa,
            acc.get("bank", "N/A"),
            acc.get("kycTier", "N/A"),
            str(round(acc.get("muleScore", 0.0), 2))
        ])
        
    t = Table(account_data, colWidths=[150, 100, 80, 80])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f0f0f0")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.black),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 12),
        ('BACKGROUND', (0,1), (-1,-1), colors.white),
        ('GRID', (0,0), (-1,-1), 1, colors.black),
    ]))
    story.append(t)
    story.append(Spacer(1, 20))
    
    # Transaction Summary
    story.append(Paragraph("<b>Transaction Summary</b>", styles['Heading2']))
    summary_text = (
        f"<b>Total Suspicious Amount:</b> ₹{str_record.get('total_amount'):,}<br/>"
        f"<b>Total Hops/Transactions Involved:</b> {str_record.get('hop_count')}<br/>"
        f"<b>Trigger Type:</b> {str_record.get('trigger_type')}"
    )
    story.append(Paragraph(summary_text, narrative_style))
    story.append(Spacer(1, 10))
    
    # Risk Narrative
    story.append(Paragraph("<b>Risk Narrative</b>", styles['Heading2']))
    story.append(Paragraph(str_record.get("risk_narrative", "No narrative provided."), narrative_style))
    story.append(Spacer(1, 20))
    
    # Analyst Info
    story.append(Paragraph("<b>Review Status</b>", styles['Heading2']))
    story.append(Paragraph(f"<b>Status:</b> {str_record.get('status')}", narrative_style))
    story.append(Paragraph(f"<b>Assigned Analyst:</b> {str_record.get('assigned_to')}", narrative_style))
    
    doc.build(story)
    return filepath
