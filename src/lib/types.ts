export type NodeType = "skill.source" | "skill.compose" | "quality.validate" | "security.scan" | "output.export";
export type RunStatus = "pending" | "running" | "success" | "warning" | "failed";

export type WorkflowNode = {
  id: string;
  type: NodeType;
  title: string;
  x: number;
  y: number;
  config: Record<string, string>;
};

export type WorkflowEdge = { id: string; source: string; target: string };

export type Workflow = {
  id: string;
  name: string;
  description: string;
  version: number;
  status: "draft" | "active" | "archived";
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  updatedAt: string;
};

export type Run = {
  id: string;
  workflowId: string;
  status: RunStatus;
  startedAt: string;
  finishedAt?: string;
  logs: { nodeId: string; message: string; status: RunStatus }[];
  artifact?: string;
  error?: string;
};
