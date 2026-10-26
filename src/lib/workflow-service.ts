import { randomUUID } from "node:crypto";
import { db } from "./db";
import { ApiError } from "./error";
import { getNodeDefinition } from "./node-registry";
import type { WorkflowEdge, WorkflowNode, WorkflowRecord } from "./types";

type WorkflowRow = {
  id: string;
  name: string;
  description: string;
  status: "draft" | "active" | "archived";
  version: number;
  graph_json: string;
  created_at: string;
  updated_at: string;
};

function parseWorkflow(row: WorkflowRow): WorkflowRecord {
  const graph = JSON.parse(row.graph_json) as {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    nodes: graph.nodes,
    edges: graph.edges,
  };
}

export function listWorkflows() {
  const rows = db
    .prepare("SELECT * FROM workflows ORDER BY updated_at DESC")
    .all() as WorkflowRow[];
  return rows.map(parseWorkflow);
}

export function createWorkflow(input: {
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}) {
  const now = new Date().toISOString();
  const id = randomUUID();
  db.prepare(
    "INSERT INTO workflows (id, name, description, status, version, graph_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(
    id,
    input.name,
    input.description,
    "draft",
    1,
    JSON.stringify({ nodes: input.nodes, edges: input.edges }),
    now,
    now,
  );
  return getWorkflow(id);
}

export function getWorkflow(id: string) {
  const row = db.prepare("SELECT * FROM workflows WHERE id = ?").get(id) as
    | WorkflowRow
    | undefined;
  if (!row) {
    throw new ApiError("NOT_FOUND", "Workflow not found.", 404);
  }
  return parseWorkflow(row);
}

export function updateWorkflow(
  id: string,
  patch: Partial<{
    name: string;
    description: string;
    status: "draft" | "active" | "archived";
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  }>,
) {
  const existing = getWorkflow(id);
  const now = new Date().toISOString();

  const next = {
    ...existing,
    name: patch.name ?? existing.name,
    description: patch.description ?? existing.description,
    status: patch.status ?? existing.status,
    nodes: patch.nodes ?? existing.nodes,
    edges: patch.edges ?? existing.edges,
    version: existing.version + (patch.nodes || patch.edges ? 1 : 0),
  };

  db.prepare(
    "UPDATE workflows SET name = ?, description = ?, status = ?, version = ?, graph_json = ?, updated_at = ? WHERE id = ?",
  ).run(
    next.name,
    next.description,
    next.status,
    next.version,
    JSON.stringify({ nodes: next.nodes, edges: next.edges }),
    now,
    id,
  );

  return getWorkflow(id);
}

export function deleteWorkflow(id: string) {
  getWorkflow(id);
  db.prepare("DELETE FROM workflows WHERE id = ?").run(id);
}

export function validateWorkflow(workflow: WorkflowRecord) {
  const issues: Array<{ code: string; message: string; nodeId?: string }> = [];

  if (!workflow.nodes.length) {
    issues.push({ code: "EMPTY_GRAPH", message: "Workflow requires at least one node." });
  }

  for (const node of workflow.nodes) {
    const def = getNodeDefinition(node.type);
    if (!def || !def.runnable) {
      issues.push({ code: "UNSUPPORTED_NODE", message: `Node ${node.type} is not runnable.`, nodeId: node.id });
      continue;
    }
    for (const key of def.requiredConfig) {
      if (node.config[key] === undefined || node.config[key] === "") {
        issues.push({ code: "MISSING_CONFIG", message: `Missing required config '${key}'.`, nodeId: node.id });
      }
    }
  }

  const nodeIds = new Set(workflow.nodes.map((node) => node.id));
  for (const edge of workflow.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      issues.push({ code: "INVALID_EDGE", message: "Edge references unknown nodes." });
    }
  }

  const indegree = new Map<string, number>();
  const graph = new Map<string, string[]>();
  for (const node of workflow.nodes) {
    indegree.set(node.id, 0);
    graph.set(node.id, []);
  }
  for (const edge of workflow.edges) {
    graph.get(edge.source)?.push(edge.target);
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, count] of indegree) {
    if (count === 0) queue.push(id);
  }

  let visited = 0;
  while (queue.length) {
    const current = queue.shift()!;
    visited += 1;
    for (const next of graph.get(current) ?? []) {
      indegree.set(next, (indegree.get(next) ?? 0) - 1);
      if (indegree.get(next) === 0) queue.push(next);
    }
  }

  if (visited !== workflow.nodes.length) {
    issues.push({ code: "CYCLE_DETECTED", message: "Cycles are not supported in this MVP engine." });
  }

  return { valid: issues.length === 0, issues };
}

function sortedNodes(workflow: WorkflowRecord) {
  const byId = new Map(workflow.nodes.map((node) => [node.id, node]));
  const indegree = new Map(workflow.nodes.map((node) => [node.id, 0]));
  const outgoing = new Map<string, string[]>();
  for (const node of workflow.nodes) outgoing.set(node.id, []);

  for (const edge of workflow.edges) {
    outgoing.get(edge.source)?.push(edge.target);
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
  }

  const queue = Array.from(indegree.entries())
    .filter(([, count]) => count === 0)
    .map(([id]) => id);

  const order: WorkflowNode[] = [];
  while (queue.length) {
    const current = queue.shift()!;
    const node = byId.get(current);
    if (node) order.push(node);
    for (const nxt of outgoing.get(current) ?? []) {
      indegree.set(nxt, (indegree.get(nxt) ?? 0) - 1);
      if (indegree.get(nxt) === 0) queue.push(nxt);
    }
  }
  return order;
}

export function createRun(workflowId: string) {
  const workflow = getWorkflow(workflowId);
  const validation = validateWorkflow(workflow);
  if (!validation.valid) {
    throw new ApiError("VALIDATION_ERROR", "The workflow configuration is invalid.", 422, validation.issues);
  }

  const runId = randomUUID();
  const started = new Date().toISOString();
  db.prepare(
    "INSERT INTO workflow_runs (id, workflow_id, workflow_version, status, started_at, logs_json, artifacts_json) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(runId, workflow.id, workflow.version, "running", started, JSON.stringify([]), JSON.stringify([]));

  let status: "success" | "warning" | "failed" = "success";
  const runLogs: string[] = [];
  let payload: Record<string, unknown> = {};

  for (const node of sortedNodes(workflow)) {
    const nodeStart = Date.now();
    let nodeStatus: string = "success";
    let output: Record<string, unknown> = payload;
    const nodeLogs: string[] = [];
    let errorCode: string | null = null;

    if (status === "failed") {
      nodeStatus = "skipped";
      output = payload;
    } else {
      switch (node.type) {
        case "existing-skill":
          output = {
            ...payload,
            selectedSkillId: node.config.skillId,
            selectedSkillName: `Skill ${node.config.skillId}`,
          };
          nodeLogs.push("Loaded skill metadata.");
          break;
        case "compose-skill":
          output = {
            ...payload,
            composedDraft: `Composed from ${String(payload.selectedSkillName ?? "unknown skill")}`,
          };
          nodeLogs.push("Composed draft skill text deterministically.");
          break;
        case "metadata-validator":
          if (!payload.composedDraft) {
            nodeStatus = "failed";
            status = "failed";
            errorCode = "MISSING_DRAFT";
            nodeLogs.push("Metadata validation failed: composed draft missing.");
          } else {
            nodeLogs.push("Metadata validation passed.");
          }
          break;
        case "security-scan":
          if (String(node.config.forceFailure ?? "false") === "true") {
            nodeStatus = "failed";
            status = "failed";
            errorCode = "SECURITY_BLOCKED";
            nodeLogs.push("Security heuristic scanner flagged blocking issue.");
          } else {
            nodeLogs.push("Security heuristic scanner returned no blocking issues.");
          }
          break;
        case "acceptance-gate":
          if (String(node.config.requireApproval ?? "true") === "true") {
            nodeStatus = "warning";
            if (status === "success") status = "warning";
            output = { ...payload, approvalRequired: true };
            nodeLogs.push("Acceptance gate requires manual approval before final release.");
          } else {
            nodeLogs.push("Acceptance gate passed automatically.");
          }
          break;
        case "export-zip":
          if (payload.approvalRequired) {
            nodeStatus = "failed";
            status = "failed";
            errorCode = "APPROVAL_REQUIRED";
            nodeLogs.push("Export blocked by acceptance gate.");
          } else {
            output = {
              ...payload,
              artifactPath: `artifacts/${String(node.config.artifactName ?? "skill")}.zip`,
            };
            nodeLogs.push("Export artifact produced.");
          }
          break;
      }
    }

    payload = output;
    runLogs.push(...nodeLogs);
    db.prepare(
      `INSERT INTO workflow_node_runs
      (id, run_id, node_id, node_type, status, started_at, completed_at, duration_ms, input_json, output_json, logs_json, error_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      randomUUID(),
      runId,
      node.id,
      node.type,
      nodeStatus,
      new Date(nodeStart).toISOString(),
      new Date().toISOString(),
      Date.now() - nodeStart,
      JSON.stringify(payload),
      JSON.stringify(output),
      JSON.stringify(nodeLogs),
      errorCode,
    );
  }

  const completed = new Date().toISOString();
  db.prepare(
    "UPDATE workflow_runs SET status = ?, completed_at = ?, duration_ms = ?, logs_json = ?, artifacts_json = ? WHERE id = ?",
  ).run(
    status,
    completed,
    Date.parse(completed) - Date.parse(started),
    JSON.stringify(runLogs),
    JSON.stringify(payload.artifactPath ? [{ path: payload.artifactPath }] : []),
    runId,
  );

  return getRun(runId);
}

export function listRuns(workflowId?: string) {
  const rows = (workflowId
    ? db
        .prepare("SELECT * FROM workflow_runs WHERE workflow_id = ? ORDER BY started_at DESC")
        .all(workflowId)
    : db.prepare("SELECT * FROM workflow_runs ORDER BY started_at DESC").all()) as Array<
    Record<string, unknown>
  >;

  return rows.map((row) => ({
    id: row.id,
    workflowId: row.workflow_id,
    workflowVersion: row.workflow_version,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    durationMs: row.duration_ms,
    logs: JSON.parse(String(row.logs_json ?? "[]")),
    artifacts: JSON.parse(String(row.artifacts_json ?? "[]")),
    errorCode: row.error_code,
  }));
}

export function getRun(runId: string) {
  const row = db.prepare("SELECT * FROM workflow_runs WHERE id = ?").get(runId) as
    | Record<string, unknown>
    | undefined;
  if (!row) throw new ApiError("NOT_FOUND", "Run not found.", 404);

  const nodeRows = db
    .prepare("SELECT * FROM workflow_node_runs WHERE run_id = ? ORDER BY started_at ASC")
    .all(runId) as Array<Record<string, unknown>>;

  return {
    id: row.id,
    workflowId: row.workflow_id,
    workflowVersion: row.workflow_version,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    durationMs: row.duration_ms,
    logs: JSON.parse(String(row.logs_json ?? "[]")),
    artifacts: JSON.parse(String(row.artifacts_json ?? "[]")),
    errorCode: row.error_code,
    nodes: nodeRows.map((node) => ({
      id: node.id,
      nodeId: node.node_id,
      nodeType: node.node_type,
      status: node.status,
      startedAt: node.started_at,
      completedAt: node.completed_at,
      durationMs: node.duration_ms,
      input: JSON.parse(String(node.input_json ?? "{}")),
      output: JSON.parse(String(node.output_json ?? "{}")),
      logs: JSON.parse(String(node.logs_json ?? "[]")),
      errorCode: node.error_code,
    })),
  };
}

export function cancelRun(runId: string) {
  const run = getRun(runId);
  if (run.status !== "running") {
    throw new ApiError("INVALID_STATE", "Only running runs can be cancelled.", 409);
  }
  db.prepare(
    "UPDATE workflow_runs SET status = 'cancelled', completed_at = ?, duration_ms = ? WHERE id = ?",
  ).run(new Date().toISOString(), Date.now() - Date.parse(String(run.startedAt)), runId);
  return getRun(runId);
}

export function listSkills() {
  return db
    .prepare(
      "SELECT id, slug, name, description, source_kind AS sourceKind, source_note AS sourceNote, created_at AS createdAt, updated_at AS updatedAt FROM skills ORDER BY name ASC",
    )
    .all();
}

export function getSkill(id: string) {
  const row = db
    .prepare(
      "SELECT id, slug, name, description, source_kind AS sourceKind, source_note AS sourceNote, created_at AS createdAt, updated_at AS updatedAt FROM skills WHERE id = ?",
    )
    .get(id);
  if (!row) throw new ApiError("NOT_FOUND", "Skill not found.", 404);
  return row;
}
