import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Run, User, Workflow } from "./types";

const dbPath = process.env.SKILLFORGE_DB_PATH ?? path.join(process.cwd(), "data", "skillforge.db");
mkdirSync(path.dirname(dbPath), { recursive: true });
export const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, csrf_hash TEXT NOT NULL,
    created_at TEXT NOT NULL, expires_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL,
    version INTEGER NOT NULL, status TEXT NOT NULL, graph_json TEXT NOT NULL,
    owner_id TEXT,
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
const workflowColumns = db.prepare("PRAGMA table_info(workflows)").all() as Array<{ name: string }>;
if (!workflowColumns.some(column => column.name === "owner_id")) db.exec("ALTER TABLE workflows ADD COLUMN owner_id TEXT");
db.exec("CREATE INDEX IF NOT EXISTS idx_workflows_owner ON workflows(owner_id); CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);");
db.prepare("INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (1, ?)").run(new Date().toISOString());

export function listWorkflows(ownerId?: string): Workflow[] {
  const rows = ownerId ? db.prepare("SELECT * FROM workflows WHERE owner_id=? ORDER BY updated_at DESC").all(ownerId) : db.prepare("SELECT * FROM workflows ORDER BY updated_at DESC").all();
  return rows.map(row => {
    const r = row as Record<string, string | number>;
    return { id: r.id as string, ownerId: (r.owner_id as string | null) ?? null, name: r.name as string, description: r.description as string, version: r.version as number, status: r.status as Workflow["status"], updatedAt: r.updated_at as string, ...JSON.parse(r.graph_json as string) };
  });
}
export function getWorkflow(id: string) { return listWorkflows().find(w => w.id === id); }
export function getWorkflowForOwner(id: string, ownerId: string) { return listWorkflows(ownerId).find(w => w.id === id); }
export function saveWorkflow(w: Workflow) {
  db.prepare("INSERT INTO workflows (id, name, description, version, status, graph_json, owner_id, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, description=excluded.description, version=excluded.version, status=excluded.status, graph_json=excluded.graph_json, owner_id=excluded.owner_id, updated_at=excluded.updated_at")
    .run(w.id, w.name, w.description, w.version, w.status, JSON.stringify({ nodes: w.nodes, edges: w.edges }), w.ownerId, w.updatedAt);
}
export function saveRun(run: Run) {
  db.prepare("INSERT INTO runs VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(run.id, run.workflowId, run.status, run.startedAt, run.finishedAt ?? null, JSON.stringify(run.logs), run.artifact ?? null, run.error ?? null);
}
export function listRuns(workflowId?: string): Run[] {
  const rows = workflowId ? db.prepare("SELECT * FROM runs WHERE workflow_id=? ORDER BY started_at DESC").all(workflowId) : db.prepare("SELECT * FROM runs ORDER BY started_at DESC").all();
  return rows.map(row => { const r = row as Record<string, string | null>; return { id: r.id as string, workflowId: r.workflow_id as string, status: r.status as Run["status"], startedAt: r.started_at as string, finishedAt: r.finished_at ?? undefined, logs: JSON.parse(r.logs_json as string), artifact: r.artifact ?? undefined, error: r.error ?? undefined }; });
}
export function getRun(id: string) { return listRuns().find(run => run.id === id); }
export function listRunsForOwner(workflowId: string, ownerId: string): Run[] {
  return listRuns(workflowId).filter(run => getWorkflowForOwner(run.workflowId, ownerId));
}
export function getRunForOwner(id: string, ownerId: string) {
  const run = getRun(id);
  return run && getWorkflowForOwner(run.workflowId, ownerId) ? run : undefined;
}
export function deleteWorkflow(id: string, ownerId: string) {
  const result = db.prepare("DELETE FROM workflows WHERE id=? AND owner_id=?").run(id, ownerId);
  return result.changes > 0;
}
export function createUser(user: User, passwordHash: string) {
  db.prepare("INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)").run(user.id, user.email, passwordHash, user.createdAt);
}
export function findUserByEmail(email: string): (User & { passwordHash: string }) | undefined {
  const row = db.prepare("SELECT id, email, password_hash, created_at FROM users WHERE email=?").get(email) as Record<string, string> | undefined;
  return row ? { id: row.id, email: row.email, passwordHash: row.password_hash, createdAt: row.created_at } : undefined;
}
export function getUser(id: string): User | undefined {
  const row = db.prepare("SELECT id, email, created_at FROM users WHERE id=?").get(id) as Record<string, string> | undefined;
  return row ? { id: row.id, email: row.email, createdAt: row.created_at } : undefined;
}
export function saveSession(idHash: string, userId: string, csrfHash: string, createdAt: string, expiresAt: string) {
  db.prepare("INSERT INTO sessions (id_hash, user_id, csrf_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)").run(idHash, userId, csrfHash, createdAt, expiresAt);
}
export function getSession(idHash: string) {
  return db.prepare("SELECT id_hash, user_id, csrf_hash, expires_at FROM sessions WHERE id_hash=?").get(idHash) as { id_hash: string; user_id: string; csrf_hash: string; expires_at: string } | undefined;
}
export function deleteSession(idHash: string) { db.prepare("DELETE FROM sessions WHERE id_hash=?").run(idHash); }
