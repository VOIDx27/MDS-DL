import axios from "axios";
import type { GraphData, AccountDetail, TracedPath } from "../types";

const API = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000" });

export async function fetchGraphData(limit = 5000): Promise<GraphData> {
  const { data } = await API.get<GraphData>(`/api/graph`, { params: { limit } });
  return data;
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
