import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Run, Workflow } from "./types";

const dbPath = process.env.SKILLFORGE_DB_PATH ?? path.join(process.cwd(), "data", "skillforge.db");
mkdirSync(path.dirname(dbPath), { recursive: true });
export const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL,
    version INTEGER NOT NULL, status TEXT NOT NULL, graph_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS runs (
    id TEXT PRIMARY KEY, workflow_id TEXT NOT NULL, status TEXT NOT NULL,
    started_at TEXT NOT NULL, finished_at TEXT, logs_json TEXT NOT NULL,
    artifact TEXT, error TEXT
  );
  CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT NOT NULL,
    content TEXT NOT NULL, source TEXT NOT NULL, version INTEGER NOT NULL
  );
`);

export function listWorkflows(): Workflow[] {
  return db.prepare("SELECT * FROM workflows ORDER BY updated_at DESC").all().map(row => {
    const r = row as Record<string, string | number>;
    return { id: r.id as string, name: r.name as string, description: r.description as string, version: r.version as number, status: r.status as Workflow["status"], updatedAt: r.updated_at as string, ...JSON.parse(r.graph_json as string) };
  });
}
export function getWorkflow(id: string) { return listWorkflows().find(w => w.id === id); }
export function saveWorkflow(w: Workflow) {
  db.prepare("INSERT INTO workflows VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, description=excluded.description, version=excluded.version, status=excluded.status, graph_json=excluded.graph_json, updated_at=excluded.updated_at")
    .run(w.id, w.name, w.description, w.version, w.status, JSON.stringify({ nodes: w.nodes, edges: w.edges }), w.updatedAt);
}
export function saveRun(run: Run) {
  db.prepare("INSERT INTO runs VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(run.id, run.workflowId, run.status, run.startedAt, run.finishedAt ?? null, JSON.stringify(run.logs), run.artifact ?? null, run.error ?? null);
}
export function listRuns(workflowId?: string): Run[] {
  const rows = workflowId ? db.prepare("SELECT * FROM runs WHERE workflow_id=? ORDER BY started_at DESC").all(workflowId) : db.prepare("SELECT * FROM runs ORDER BY started_at DESC").all();
  return rows.map(row => { const r = row as Record<string, string | null>; return { id: r.id as string, workflowId: r.workflow_id as string, status: r.status as Run["status"], startedAt: r.started_at as string, finishedAt: r.finished_at ?? undefined, logs: JSON.parse(r.logs_json as string), artifact: r.artifact ?? undefined, error: r.error ?? undefined }; });
}
export function getRun(id: string) { return listRuns().find(run => run.id === id); }
