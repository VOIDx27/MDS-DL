import React from "react";
import type { TooltipData } from "./types";
import { mpsColor } from "./utils/colors";

interface Props {
  data: TooltipData | null;
}

export const Tooltip: React.FC<Props> = ({ data }) => {
  if (!data) return null;
  const { x, y, node } = data;
  const risk = node.muleScore >= 0.85 ? "high-risk" : node.muleScore >= 0.65 ? "mule" : "clear";
  const riskLabel = risk === "high-risk" ? "HIGH RISK" : risk === "mule" ? "MULE SUSPECT" : "CLEAR";

  return (
    <div className="graph-tooltip" style={{ left: x + 14, top: y - 10 }}>
      <div className="tt-vpa">{node.vpa}</div>
      <div className="tt-row"><span className="tt-label">Bank</span><span className="tt-value">{node.bank}</span></div>
      <div className="tt-row"><span className="tt-label">MPS</span><span className="tt-value">{node.muleScore.toFixed(2)}</span></div>
      <div className="tt-row"><span className="tt-label">KYC</span><span className="tt-value">{node.kycTier}</span></div>
      <div className="tt-row"><span className="tt-label">Age</span><span className="tt-value">{node.accountAge}d</span></div>
      <div className="tt-mps-bar">
        <div className="tt-mps-fill" style={{ width: `${node.muleScore * 100}%`, background: mpsColor(node.muleScore) }} />
      </div>
      <div style={{ marginTop: 8 }}>
        <span className={`tt-badge ${risk}`}>{riskLabel}</span>
        {node.ringId && <span className="tt-badge mule" style={{ marginLeft: 6 }}>RING</span>}
      </div>
    </div>
  );
};
