import type { GraphNode, NodeRisk } from "../types";

/* ─── Node Colors ─────────────────────────────────────────────────────────── */
export const NODE_COLORS: Record<NodeRisk, string> = {
  normal: "#3b82f6",
  mule: "#f59e0b",
  high_risk: "#ef4444",
};

export const NODE_BORDER: Record<NodeRisk, string> = {
  normal: "#2563eb",
  mule: "#d97706",
  high_risk: "#dc2626",
};

/* ─── Edge Colors ─────────────────────────────────────────────────────────── */
export const EDGE_COLORS = {
  normal: "#334155",
  layering: "#ef4444",
  suspicious: "#f59e0b",
};

/* ─── Risk Classification ─────────────────────────────────────────────────── */
export function classifyNode(node: GraphNode): NodeRisk {
  if (node.muleScore >= 0.85) return "high_risk";
  if (node.muleScore >= 0.65) return "mule";
  return "normal";
}

/* ─── Node Size ───────────────────────────────────────────────────────────── */
export function nodeSize(node: GraphNode): number {
  const risk = classifyNode(node);
  const base = risk === "high_risk" ? 14 : risk === "mule" ? 11 : 7;
  const volFactor = Math.min(Math.log10(Math.max(node.transactionVolume, 1)) / 5, 1);
  return base + volFactor * 6;
}

/* ─── MPS Color for bar fills ─────────────────────────────────────────────── */
export function mpsColor(score: number): string {
  if (score >= 0.85) return "#ef4444";
  if (score >= 0.65) return "#f59e0b";
  if (score >= 0.4) return "#eab308";
  return "#10b981";
}

/* ─── Edge Width ──────────────────────────────────────────────────────────── */
export function edgeWidth(amount: number): number {
  return Math.max(0.5, Math.min(Math.log10(Math.max(amount, 1)) / 3, 4));
}

