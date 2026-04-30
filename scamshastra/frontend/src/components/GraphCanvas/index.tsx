import React, { useState } from "react";
import { useGraphData } from "./hooks/useGraphData";
import { ControlsToolbar } from "./ControlsToolbar";
import { AccountDetailPanel } from "./AccountDetailPanel";
import { Tooltip } from "./Tooltip";
import { SigmaRenderer } from "./SigmaRenderer";
import type { TooltipData, EvidenceItem, GraphNode } from "./types";
import "./GraphCanvas.css";

export const GraphCanvas: React.FC = () => {
  const { data, loading, error, filters, setFilters } = useGraphData();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [evidenceBasket, setEvidenceBasket] = useState<EvidenceItem[]>([]);

  const handleNodeClick = (nodeId: string) => {
    setSelectedAccountId(nodeId);
    setTooltipData(null);
  };

  const handleNodeHover = (node: GraphNode | null, x?: number, y?: number) => {
    if (node && x !== undefined && y !== undefined) {
      setTooltipData({ x, y, node });
    } else {
      setTooltipData(null);
    }
  };

  const handleAddEvidence = (item: EvidenceItem) => {
    setEvidenceBasket((prev) => {
      if (prev.find((e) => e.id === item.id)) return prev;
      return [...prev, item];
    });
  };

  return (
    <div className="graph-canvas-root">
      <ControlsToolbar
        filters={filters}
        setFilters={setFilters}
        onRunRingDetection={() => alert("Ring Detection triggered")}
        onExportEvidence={() => alert(`Exporting ${evidenceBasket.length} items`)}
      />

      <div className="graph-canvas-body">
        {loading && (
          <div className="graph-loading">
            <div className="loading-spinner" />
            <div className="loading-text">Loading Graph Network...</div>
          </div>
        )}

        {error && (
          <div className="graph-loading">
            <div className="loading-text" style={{ color: "var(--fg-red)" }}>
              {error}
            </div>
          </div>
        )}

        {!loading && !error && data && (
          <div className="graph-viewport">
            {/* Render Sigma */}
            <SigmaRenderer data={data} onNodeClick={handleNodeClick} onNodeHover={handleNodeHover} />
            <Tooltip data={tooltipData} />
          </div>
        )}

        {selectedAccountId && (
          <AccountDetailPanel
            accountId={selectedAccountId}
            onClose={() => setSelectedAccountId(null)}
            onAddEvidence={handleAddEvidence}
          />
        )}
      </div>

      <div className="graph-statusbar">
        <div className="status-dot" />
        <span>Graph Engine Active</span>
        <span style={{ marginLeft: "auto" }}>
          Nodes: {data?.nodes.length || 0} | Edges: {data?.edges.length || 0} | Rings: {data?.rings.length || 0}
        </span>
        {evidenceBasket.length > 0 && (
          <span style={{ marginLeft: 16, color: "var(--fg-amber)" }}>
            Evidence Basket: {evidenceBasket.length}
          </span>
        )}
      </div>
    </div>
  );
};
