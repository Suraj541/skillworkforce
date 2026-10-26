export type WorkflowStatus = "draft" | "active" | "archived";

export type WorkflowNodeType =
  | "existing-skill"
  | "compose-skill"
  | "metadata-validator"
  | "security-scan"
  | "acceptance-gate"
  | "export-zip";

export type RunStatus =
  | "pending"
  | "running"
  | "success"
  | "warning"
  | "failed"
  | "skipped"
  | "cancelled";

export type WorkflowNode = {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  version: number;
};

export type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  branchLabel?: string | null;
};

export type WorkflowRecord = {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};
