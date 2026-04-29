import { useState, useEffect, useCallback } from "react";
import type { GraphData, FilterState } from "../types";
import { fetchGraphData } from "../utils/api";
import { classifyNode, nodeSize, NODE_COLORS, edgeWidth, EDGE_COLORS } from "../utils/colors";

const INITIAL_FILTERS: FilterState = {
  minMPS: 0,
  dateRange: null,
  showLayeringPaths: true,
  showFraudRingHulls: true,
};

export function useGraphData() {
  const [raw, setRaw] = useState<GraphData | null>(null);
  const [filtered, setFiltered] = useState<GraphData | null>(null);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGraphData(5000);
      // Enrich nodes with computed visual properties
      data.nodes = data.nodes.map((n) => {
        const risk = classifyNode(n);
        return {
          ...n,
          risk,
          shape: risk === "high_risk" ? "hexagon" as const : risk === "mule" ? "diamond" as const : "circle" as const,
          size: nodeSize(n),
          color: NODE_COLORS[risk],
        };
      });
      data.edges = data.edges.map((e) => {
        const t = e.lrs && e.lrs >= 0.85 ? "layering" as const : e.lrs && e.lrs >= 0.5 ? "suspicious" as const : "normal" as const;
        return { ...e, edgeType: t, width: edgeWidth(e.amount), color: EDGE_COLORS[t] };
      });
      setRaw(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load graph");
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters whenever raw data or filters change
  useEffect(() => {
    if (!raw) { setFiltered(null); return; }
    let nodes = raw.nodes.filter((n) => n.muleScore >= filters.minMPS);
    const nodeIds = new Set(nodes.map((n) => n.id));
    let edges = raw.edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
    if (filters.dateRange) {
      const [start, end] = filters.dateRange;
      edges = edges.filter((e) => e.timestamp >= start && e.timestamp <= end);
    }
    if (!filters.showLayeringPaths) {
      edges = edges.map((e) => (e.edgeType === "layering" ? { ...e, edgeType: "normal" as const, color: EDGE_COLORS.normal } : e));
    }
    const rings = filters.showFraudRingHulls ? raw.rings : [];
    setFiltered({ nodes, edges, rings });
  }, [raw, filters]);

  useEffect(() => { load(); }, [load]);

  return { data: filtered, raw, loading, error, filters, setFilters, reload: load };
}
