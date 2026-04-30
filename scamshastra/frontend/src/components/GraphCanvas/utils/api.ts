import axios from "axios";
import type { GraphData, AccountDetail, TracedPath, GraphNode, GraphEdge } from "../types";

const API = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000" });

function generateMockGraph(): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  
  // Create fraudster
  nodes.push({ id: "fraudster", vpa: "fraudster@upi", bank: "Bank", muleScore: 0.95, transactionVolume: 50000, risk: "high_risk" });
  
  // Layering
  for (let i = 0; i < 5; i++) {
    const id = `layer_${i}`;
    nodes.push({ id, vpa: `layer_${i}@upi`, bank: "Bank", muleScore: 0.7 + Math.random() * 0.2, transactionVolume: 20000, risk: "mule" });
    if (i === 0) {
      edges.push({ id: `e_start_${i}`, source: "fraudster", target: id, amount: 20000, timestamp: Date.now(), lrs: 0.9 });
    } else {
      edges.push({ id: `e_layer_${i}`, source: `layer_${i-1}`, target: id, amount: 19000, timestamp: Date.now(), lrs: 0.9 });
    }
  }

  // Normal nodes
  for (let i = 0; i < 50; i++) {
    const id = `normal_${i}`;
    nodes.push({ id, vpa: `user_${i}@upi`, bank: "Bank", muleScore: Math.random() * 0.3, transactionVolume: Math.random() * 5000, risk: "normal" });
    if (i > 0 && Math.random() > 0.5) {
      edges.push({ id: `e_norm_${i}`, source: `normal_${i-1}`, target: id, amount: Math.random() * 1000, timestamp: Date.now(), lrs: 0.1 });
    }
  }
  
  return { nodes, edges, rings: [] };
}

export async function fetchGraphData(limit = 5000): Promise<GraphData> {
  try {
    const { data } = await API.get<GraphData>(`/api/graph`, { params: { limit } });
    return data;
  } catch (error) {
    console.warn("Backend offline, falling back to mock UI data.");
    return generateMockGraph();
  }
}

export async function fetchAccountDetail(accountId: string): Promise<AccountDetail> {
  const { data } = await API.post<AccountDetail>(`/api/score/account/${accountId}`);
  return {
    ...data,
    signals: (data as any).signals ?? [],
    transactions: (data as any).transactions ?? [],
  };
}

export async function tracePath(sourceId: string, targetId: string): Promise<TracedPath> {
  const { data } = await API.post<TracedPath>(`/api/score/path`, { source_id: sourceId, target_id: targetId });
  return data;
}

export async function runRingDetection() {
  const { data } = await API.post("/api/rings/detect");
  return data;
}

export async function exportEvidence(ids: string[]) {
  const { data } = await API.post("/api/evidence/export", { account_ids: ids });
  return data;
}

