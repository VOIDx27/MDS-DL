export type NodeRisk = "normal" | "mule" | "high_risk";
export type NodeShape = "circle" | "diamond" | "hexagon";

export interface GraphNode {
  id: string;
  vpa: string;
  bank: string;
  kycTier: "FULL" | "MIN" | "NONE";
  accountAge: number;
  muleScore: number;
  isFlagged: boolean;
  ringId: string | null;
  deviceIds: string[];
  transactionVolume: number;
  x?: number;
  y?: number;
  risk?: NodeRisk;
  shape?: NodeShape;
  size?: number;
  color?: string;
}

export type EdgeType = "normal" | "layering" | "suspicious";

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  utr: string;
  amount: number;
  timestamp: string;
  bank: string;
  city: string;
  state: string;
  status: string;
  edgeType?: EdgeType;
  lrs?: number;
  width?: number;
  color?: string;
}

export interface FraudRing {
  ringId: string;
  memberIds: string[];
  status: string;
  estimatedValue: number;
  memberCount: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  rings: FraudRing[];
}

export interface FilterState {
  minMPS: number;
  dateRange: [string, string] | null;
  showLayeringPaths: boolean;
  showFraudRingHulls: boolean;
}

export interface MPSSignal {
  name: string;
  raw_score: number;
  weight: number;
  weighted_score: number;
  explanation: string;
}

export interface TransactionRecord {
  utr: string;
  direction: "sent" | "received";
  counterpartyVpa: string;
  amount: number;
  timestamp: string;
  status: string;
}

export interface AccountDetail {
  id: string;
  vpa: string;
  bank: string;
  kycTier: string;
  accountAge: number;
  muleScore: number;
  isFlagged: boolean;
  ringId: string | null;
  deviceIds: string[];
  signals: MPSSignal[];
  transactions: TransactionRecord[];
}

export interface TracedPath {
  hops: { from_vpa: string; to_vpa: string; amount: number; hold_minutes: number | null }[];
  lrs: number;
  verdict: string;
}

export interface EvidenceItem {
  id: string;
  vpa: string;
  muleScore: number;
  addedAt: string;
  notes: string;
}

export interface TooltipData {
  x: number;
  y: number;
  node: GraphNode;
}

