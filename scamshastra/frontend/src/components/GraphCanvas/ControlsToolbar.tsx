import React from "react";
import type { FilterState } from "./types";

interface Props {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onRunRingDetection: () => void;
  onExportEvidence: () => void;
}

export const ControlsToolbar: React.FC<Props> = ({
  filters,
  setFilters,
  onRunRingDetection,
  onExportEvidence,
}) => {
  return (
    <div className="controls-toolbar">
      <div className="control-group">
        <span className="control-label">Layering Paths</span>
        <div
          className={`toggle-switch ${filters.showLayeringPaths ? "active" : ""}`}
          onClick={() =>
            setFilters((f) => ({ ...f, showLayeringPaths: !f.showLayeringPaths }))
          }
        />
      </div>

      <div className="control-group">
        <span className="control-label">Fraud Rings</span>
        <div
          className={`toggle-switch ${filters.showFraudRingHulls ? "active" : ""}`}
          onClick={() =>
            setFilters((f) => ({ ...f, showFraudRingHulls: !f.showFraudRingHulls }))
          }
        />
      </div>

      <div className="divider" />

      <div className="control-group">
        <span className="control-label">Min MPS</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={filters.minMPS}
          onChange={(e) =>
            setFilters((f) => ({ ...f, minMPS: parseFloat(e.target.value) }))
          }
          className="mps-slider"
        />
        <span className="mps-value">{filters.minMPS.toFixed(2)}</span>
      </div>

      <div className="divider" />

      <div className="control-group">
        <button className="toolbar-btn primary" onClick={onRunRingDetection}>
          Run Ring Detection
        </button>
        <button className="toolbar-btn" onClick={onExportEvidence}>
          Export Evidence Package
        </button>
      </div>
    </div>
  );
};
