/**
 * FraudGraph — Shared TypeScript Types
 *
 * Canonical type definitions shared across frontend and any Node-based tooling.
 */

// ─── Entity Types ────────────────────────────────────

export interface User {
  id: string;
  name: string;
  phone: string;
  vpa: string; // UPI Virtual Payment Address (e.g. user@upi)
  kycStatus: "verified" | "pending" | "rejected";
  riskScore: number;
  createdAt: string;
}

export interface Account {
  accountNumber: string;
  ifsc: string;
  bankName: string;
  userId: string;
  balance: number;
  isFrozen: boolean;
  createdAt: string;
}

export interface Device {
  id: string;
  userId: string;
  fingerprint: string;
  ipAddress: string;
  lastSeen: string;
}

// ─── Transaction Types ───────────────────────────────

export type TransactionStatus = "SUCCESS" | "FAILED" | "PENDING" | "REVERSED";
export type TransactionType = "P2P" | "P2M" | "COLLECT" | "MANDATE";

export interface Transaction {
  id: string;
  senderVpa: string;
  receiverVpa: string;
  amount: number;
  currency: "INR";
  type: TransactionType;
  status: TransactionStatus;
  rrn: string; // Retrieval Reference Number
  timestamp: string;
  remarks: string;
}

// ─── Alert / Case Types ──────────────────────────────

export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type CaseStatus = "OPEN" | "INVESTIGATING" | "ESCALATED" | "CLOSED";

export interface Alert {
  id: string;
  type: string;
  severity: AlertSeverity;
  description: string;
  relatedEntityIds: string[];
  createdAt: string;
}

export interface Case {
  id: string;
  title: string;
  status: CaseStatus;
  assignee: string;
  alertIds: string[];
  strFiled: boolean; // Suspicious Transaction Report
  createdAt: string;
  updatedAt: string;
}

// ─── Graph Types ─────────────────────────────────────

export interface GraphNode {
  id: string;
  label: string;
  type: "User" | "Account" | "Device" | "Transaction";
  properties: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  properties: Record<string, unknown>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
