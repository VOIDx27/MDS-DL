import React, { useEffect, useState } from "react";
import { fetchAccountDetail } from "./utils/api";
import type { AccountDetail, EvidenceItem } from "./types";
import { mpsColor } from "./utils/colors";

interface Props {
  accountId: string | null;
  onClose: () => void;
  onAddEvidence: (item: EvidenceItem) => void;
}

export const AccountDetailPanel: React.FC<Props> = ({ accountId, onClose, onAddEvidence }) => {
  const [detail, setDetail] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) {
      setDetail(null);
      return;
    }
    let active = true;
    setLoading(true);
    fetchAccountDetail(accountId)
      .then((data) => {
        if (active) {
          setDetail(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) setError(err.message || "Failed to load account details");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [accountId]);

  if (!accountId) return null;

  return (
    <div className="detail-panel">
      <div className="detail-panel-header">
        <div>
          <div className="detail-vpa">{detail ? detail.vpa : "Loading..."}</div>
          {detail && <div className="detail-bank">{detail.bank}</div>}
        </div>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>

      {loading && <div className="detail-section">Loading...</div>}
      {error && <div className="detail-section" style={{ color: "red" }}>{error}</div>}

      {detail && (
        <>
          <div className="detail-section">
            <div className="detail-section-title">Risk Assessment</div>
            <div className="mps-score-display">
              <span className={`mps-score-big ${detail.muleScore >= 0.85 ? "high-risk" : detail.muleScore >= 0.65 ? "mule" : "clear"}`}>
                {detail.muleScore.toFixed(2)}
              </span>
              <span>MPS</span>
            </div>
            
            <div className="signal-bars">
              {detail.signals.map((sig, idx) => (
                <div key={idx} className="signal-bar-row" title={sig.explanation}>
                  <div className="signal-bar-label">{sig.name}</div>
                  <div className="signal-bar-track">
                    <div
                      className="signal-bar-fill"
                      style={{ width: `${sig.raw_score * 100}%`, background: mpsColor(sig.raw_score) }}
                    />
                  </div>
                  <div className="signal-bar-value">{sig.raw_score.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-section-title">Identity & Info</div>
            <div className="detail-info-grid">
              <div className="detail-info-item">
                <div className="label">KYC Tier</div>
                <div className="value">{detail.kycTier}</div>
              </div>
              <div className="detail-info-item">
                <div className="label">Account Age</div>
                <div className="value">{detail.accountAge} days</div>
              </div>
            </div>
            {detail.ringId && (
              <div style={{ marginTop: 12 }}>
                <span className="ring-badge">MEMBER OF {detail.ringId}</span>
              </div>
            )}
            {detail.deviceIds && detail.deviceIds.length > 0 && (
              <div style={{ marginTop: 12, fontSize: 12 }}>
                <span style={{ color: "var(--fg-text-dim)" }}>Devices: </span>
                {detail.deviceIds.join(", ")}
              </div>
            )}
          </div>

          <div className="detail-section">
            <div className="detail-section-title">Recent Transactions</div>
            <ul className="txn-list">
              {detail.transactions.slice(0, 20).map((t, idx) => (
                <li key={idx} className="txn-item">
                  <div>
                    <span className={`txn-dir ${t.direction}`}>{t.direction}</span>
                    <div className="txn-vpa">{t.counterpartyVpa}</div>
                    <div className="txn-time">{new Date(t.timestamp).toLocaleString()}</div>
                  </div>
                  <div className="txn-amount">₹{t.amount.toLocaleString()}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="detail-actions">
            <button
              className="action-btn evidence"
              onClick={() => onAddEvidence({ id: detail.id, vpa: detail.vpa, muleScore: detail.muleScore, addedAt: new Date().toISOString(), notes: "" })}
            >
              Add to Evidence
            </button>
            <button className="action-btn str">Generate STR</button>
          </div>
        </>
      )}
    </div>
  );
};
