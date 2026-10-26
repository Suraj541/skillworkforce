import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { unzipSync } from "fflate";

const databasePath = path.join(mkdtempSync(path.join(tmpdir(), "skillforge-test-")), "test.db");
process.env.SKILLFORGE_DB_PATH = databasePath;

let db: typeof import("./db").db;
let saveWorkflow: typeof import("./db").saveWorkflow;
let runWorkflow: typeof import("./engine").runWorkflow;
let validateWorkflow: typeof import("./engine").validateWorkflow;
let defaultWorkflow: typeof import("./node-catalog").defaultWorkflow;
let createWorkflow: typeof import("../app/api/workflows/route").POST;
const ownerId = "test-owner";
let createUser: typeof import("./db").createUser;
let createSession: typeof import("./auth").createSession;
let hashPassword: typeof import("./auth").hashPassword;
let listWorkflows: typeof import("./db").listWorkflows;
let getWorkflowForOwner: typeof import("./db").getWorkflowForOwner;
let getRunForOwner: typeof import("./db").getRunForOwner;
let saveRun: typeof import("./db").saveRun;
let createWorkflowRoute: typeof import("../app/api/workflows/route").POST;
let listWorkflowsRoute: typeof import("../app/api/workflows/route").GET;
let readWorkflowRoute: typeof import("../app/api/workflows/[id]/route").GET;
let updateWorkflowRoute: typeof import("../app/api/workflows/[id]/route").PATCH;
let deleteWorkflowRoute: typeof import("../app/api/workflows/[id]/route").DELETE;
let runRoute: typeof import("../app/api/workflows/[id]/runs/route").POST;
let readRunRoute: typeof import("../app/api/runs/[runId]/route").GET;
let loginRoute: typeof import("../app/api/auth/login/route").POST;
let meRoute: typeof import("../app/api/auth/me/route").GET;
let logoutRoute: typeof import("../app/api/auth/logout/route").POST;
let listUnownedWorkflowIds: typeof import("./ownership-recovery").listUnownedWorkflowIds;
let previewLegacyRecovery: typeof import("./ownership-recovery").previewLegacyRecovery;
let reassignLegacyWorkflows: typeof import("./ownership-recovery").reassignLegacyWorkflows;
let clearRateLimitsForTests: typeof import("./rate-limit").clearRateLimitsForTests;

function workflow(overrides: Partial<typeof defaultWorkflow> = {}) {
  return { id: crypto.randomUUID(), ownerId, ...defaultWorkflow, ...overrides, version: 1, status: "draft" as const, updatedAt: new Date().toISOString() };
}

test.before(async () => {
  ({ db, saveWorkflow } = await import("./db"));
  ({ runWorkflow, validateWorkflow } = await import("./engine"));
  ({ defaultWorkflow } = await import("./node-catalog"));
  ({ POST: createWorkflow, GET: listWorkflowsRoute } = await import("../app/api/workflows/route"));
  createWorkflowRoute = createWorkflow;
  ({ GET: readWorkflowRoute, PATCH: updateWorkflowRoute, DELETE: deleteWorkflowRoute } = await import("../app/api/workflows/[id]/route"));
  ({ POST: runRoute } = await import("../app/api/workflows/[id]/runs/route"));
  ({ GET: readRunRoute } = await import("../app/api/runs/[runId]/route"));
  ({ POST: loginRoute } = await import("../app/api/auth/login/route"));
  ({ GET: meRoute } = await import("../app/api/auth/me/route"));
  ({ POST: logoutRoute } = await import("../app/api/auth/logout/route"));
  ({ createUser } = await import("./db"));
  ({ createSession, hashPassword } = await import("./auth"));
  ({ listWorkflows, getWorkflowForOwner, getRunForOwner, saveRun } = await import("./db"));
  ({ listUnownedWorkflowIds, previewLegacyRecovery, reassignLegacyWorkflows } = await import("./ownership-recovery"));
  ({ clearRateLimitsForTests } = await import("./rate-limit"));
  createUser({ id: "user-a", email: "a@example.test", createdAt: new Date().toISOString() }, hashPassword("correct horse battery staple"));
  createUser({ id: "user-b", email: "b@example.test", createdAt: new Date().toISOString() }, hashPassword("correct horse battery staple"));
});
test.after(() => rmSync(path.dirname(databasePath), { recursive: true, force: true }));

test("valid workflow executes in topological order and creates a readable ZIP", () => {
  const saved = workflow();
  saveWorkflow(saved);
  const run = runWorkflow(saved.id, ownerId);
  assert.equal(run.status, "success");
  assert.deepEqual(run.logs.map(log => log.nodeId), ["source", "compose", "validate", "scan", "export"]);
  const archive = unzipSync(readFileSync(run.artifact!));
  assert.deepEqual(Object.keys(archive).sort(), ["SKILL.md", "manifest.json"]);
});

test("validation rejects duplicate nodes, broken edges, cycles, and unsupported types", () => {
  const duplicate = workflow({ nodes: [defaultWorkflow.nodes[0], { ...defaultWorkflow.nodes[0] }] });
  assert.equal(validateWorkflow(duplicate).valid, false);
  assert.match(validateWorkflow({ ...workflow(), edges: [{ id: "broken", source: "missing", target: "source" }] }).errors.join(" "), /unknown node/);
  assert.match(validateWorkflow({ ...workflow(), edges: [{ id: "cycle", source: "source", target: "source" }] }).errors.join(" "), /cycle/);
  const unsupported = workflow({ nodes: [{ ...defaultWorkflow.nodes[0], type: "unknown.node" as never }] });
  assert.match(validateWorkflow(unsupported).errors.join(" "), /unsupported node type/);
});

test("security gate fails the run and does not create an artifact", () => {
  const saved = workflow({ nodes: defaultWorkflow.nodes.map(node => node.id === "scan" ? { ...node, config: { block: "true" } } : node) });
  saveWorkflow(saved);
  const run = runWorkflow(saved.id, ownerId);
  assert.equal(run.status, "failed");
  assert.equal(run.error, "SECURITY_GATE_BLOCKED");
  assert.equal(run.artifact, undefined);
});

test("create route rejects malformed JSON with a stable error envelope", async () => {
  const session = createSession({ id: "user-a", email: "a@example.test", createdAt: new Date().toISOString() });
  const response = (await createWorkflow!(new Request("http://localhost/api/workflows", { method: "POST", body: "{", headers: { "content-type": "application/json", origin: "http://127.0.0.1:3000", cookie: `skillforge_session=${session.session}; skillforge_csrf=${session.csrf}`, "x-csrf-token": session.csrf } })))!;
  assert.equal(response.status, 400);
  assert.deepEqual((await response.json()).error.code, "INVALID_JSON");
});

test("workflow and run routes enforce authentication, ownership, and CSRF", async () => {
  const unauthenticated = (await listWorkflowsRoute!(new Request("http://127.0.0.1:3000/api/workflows")))!;
  assert.equal(unauthenticated.status, 401);
  const a = createSession({ id: "user-a", email: "a@example.test", createdAt: new Date().toISOString() });
  const b = createSession({ id: "user-b", email: "b@example.test", createdAt: new Date().toISOString() });
  const headers = { origin: "http://127.0.0.1:3000", cookie: `skillforge_session=${a.session}; skillforge_csrf=${a.csrf}`, "x-csrf-token": a.csrf, "content-type": "application/json" };
  const created = (await createWorkflowRoute!(new Request("http://127.0.0.1:3000/api/workflows", { method: "POST", headers, body: JSON.stringify({ name: "Owned workflow" }) })))!;
  assert.equal(created.status, 201);
  const workflowId = (await created.json()).data.id as string;
  const otherHeaders = { origin: "http://127.0.0.1:3000", cookie: `skillforge_session=${b.session}; skillforge_csrf=${b.csrf}`, "x-csrf-token": b.csrf };
  assert.equal((await readWorkflowRoute!(new Request("http://127.0.0.1:3000", { headers: otherHeaders }), { params: Promise.resolve({ id: workflowId }) }))!.status, 404);
  assert.equal((await updateWorkflowRoute!(new Request("http://127.0.0.1:3000", { method: "PATCH", headers: { ...otherHeaders, "content-type": "application/json" }, body: JSON.stringify({ name: "hijacked" }) }), { params: Promise.resolve({ id: workflowId }) }))!.status, 404);
  assert.equal((await deleteWorkflowRoute!(new Request("http://127.0.0.1:3000", { method: "DELETE", headers: otherHeaders }), { params: Promise.resolve({ id: workflowId }) }))!.status, 404);
  assert.equal((await runRoute!(new Request("http://127.0.0.1:3000", { method: "POST", headers: otherHeaders }), { params: Promise.resolve({ id: workflowId }) }))!.status, 404);
  assert.equal((await createWorkflowRoute!(new Request("http://127.0.0.1:3000/api/workflows", { method: "POST", headers: { ...headers, "x-csrf-token": "wrong" }, body: "{}" })))!.status, 403);
  const run = (await runRoute!(new Request("http://127.0.0.1:3000", { method: "POST", headers }), { params: Promise.resolve({ id: workflowId }) }))!;
  assert.equal(run.status, 201);
  const runId = (await run.json()).data.id as string;
  assert.equal((await readRunRoute!(new Request("http://127.0.0.1:3000", { headers: otherHeaders }), { params: Promise.resolve({ runId }) }))!.status, 404);
  assert.equal(getWorkflowForOwner(workflowId, "user-a")?.ownerId, "user-a");
  assert.equal(listWorkflows("user-b").length, 0);
});

test("login creates a session, rejects cross-origin requests, and expired sessions are denied", async () => {
  const crossOrigin = (await loginRoute!(new Request("http://127.0.0.1:3000/api/auth/login", { method: "POST", headers: { origin: "https://evil.example", "content-type": "application/json" }, body: JSON.stringify({ email: "a@example.test", password: "correct horse battery staple" }) })))!;
  assert.equal(crossOrigin.status, 403);
  const response = (await loginRoute!(new Request("http://127.0.0.1:3000/api/auth/login", { method: "POST", headers: { origin: "http://127.0.0.1:3000", "content-type": "application/json" }, body: JSON.stringify({ email: "a@example.test", password: "correct horse battery staple" }) })))!;
  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie")!;
  assert.match(cookie, /skillforge_session=/);
  const sessionToken = cookie.match(/skillforge_session=([^;]+)/)![1];
  assert.equal((await meRoute!(new Request("http://127.0.0.1:3000/api/auth/me", { headers: { cookie: `skillforge_session=${sessionToken}` } })))!.status, 200);
  db.prepare("UPDATE sessions SET expires_at=? WHERE id_hash=(SELECT id_hash FROM sessions ORDER BY created_at DESC LIMIT 1)").run(new Date(Date.now() - 1_000).toISOString());
  assert.equal((await meRoute!(new Request("http://127.0.0.1:3000/api/auth/me", { headers: { cookie: `skillforge_session=${sessionToken}` } })))!.status, 401);
});

test("login rate limits bursts and resets after expiry without trusting spoofed forwarding headers", async () => {
  process.env.SKILLFORGE_RATE_LIMIT = "2";
  process.env.SKILLFORGE_RATE_WINDOW_MS = "25";
  clearRateLimitsForTests();
  const headers = { origin: "http://127.0.0.1:3000", "content-type": "application/json", "x-forwarded-for": "1.2.3.4" };
  for (let index = 0; index < 2; index++) {
    const response = await loginRoute!(new Request("http://127.0.0.1:3000/api/auth/login", { method: "POST", headers, body: JSON.stringify({ email: `rate-${index}@example.test`, password: "wrong-password" }) }));
    assert.equal(response.status, 401);
  }
  const limited = await loginRoute!(new Request("http://127.0.0.1:3000/api/auth/login", { method: "POST", headers, body: JSON.stringify({ email: "rate-2@example.test", password: "wrong-password" }) }));
  assert.equal(limited.status, 429);
  await new Promise(resolve => setTimeout(resolve, 35));
  const reset = await loginRoute!(new Request("http://127.0.0.1:3000/api/auth/login", { method: "POST", headers, body: JSON.stringify({ email: "rate-reset@example.test", password: "wrong-password" }) }));
  assert.equal(reset.status, 401);
  delete process.env.SKILLFORGE_RATE_LIMIT;
  delete process.env.SKILLFORGE_RATE_WINDOW_MS;
  clearRateLimitsForTests();
});

test("logout invalidates a valid session", async () => {
  const session = createSession({ id: "user-a", email: "a@example.test", createdAt: new Date().toISOString() });
  const cookie = `skillforge_session=${session.session}; skillforge_csrf=${session.csrf}`;
  const response = (await logoutRoute!(new Request("http://127.0.0.1:3000/api/auth/logout", { method: "POST", headers: { origin: "http://127.0.0.1:3000", cookie, "x-csrf-token": session.csrf } })))!;
  assert.equal(response.status, 200);
  assert.equal((await meRoute!(new Request("http://127.0.0.1:3000/api/auth/me", { headers: { cookie } })))!.status, 401);
});

test("legacy migration preserves workflows and runs without assigning ownership", () => {
  const legacyDir = mkdtempSync(path.join(tmpdir(), "skillforge-legacy-"));
  const legacyPath = path.join(legacyDir, "legacy.db");
  const env = { ...process.env, LEGACY: legacyPath, SKILLFORGE_DB_PATH: legacyPath };
  execFileSync(process.execPath, ["--input-type=module", "-e", `
    import { DatabaseSync } from "node:sqlite";
    const db = new DatabaseSync(process.env.LEGACY);
    db.exec(\`CREATE TABLE workflows (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, version INTEGER NOT NULL, status TEXT NOT NULL, graph_json TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE runs (id TEXT PRIMARY KEY, workflow_id TEXT NOT NULL, status TEXT NOT NULL, started_at TEXT NOT NULL, finished_at TEXT, logs_json TEXT NOT NULL, artifact TEXT, error TEXT);
    INSERT INTO workflows VALUES ('legacy-wf','Legacy','Preserve',1,'draft','{"nodes":[],"edges":[]}', '2026-01-01T00:00:00Z');
    INSERT INTO runs VALUES ('legacy-run','legacy-wf','success','2026-01-01T00:00:00Z','2026-01-01T00:00:01Z','[]',NULL,NULL);\`);
  `], { env, stdio: "ignore" });
  execFileSync(process.execPath, ["scripts/db-init.mjs"], { env, stdio: "ignore" });
  const result = execFileSync(process.execPath, ["--input-type=module", "-e", `
    import { DatabaseSync } from "node:sqlite";
    const db = new DatabaseSync(process.env.LEGACY);
    const workflow = db.prepare("SELECT id, owner_id FROM workflows WHERE id='legacy-wf'").get();
    const run = db.prepare("SELECT id FROM runs WHERE id='legacy-run'").get();
    const migration = db.prepare("SELECT version FROM schema_migrations WHERE version=1").get();
    if (!workflow || workflow.owner_id !== null || !run || !migration) process.exit(1);
    console.log("preserved");
  `], { env });
  assert.match(result.toString(), /preserved/);
  rmSync(legacyDir, { recursive: true, force: true });
});

test("legacy ownership recovery previews, reassigns atomically, and audits without exposing content", () => {
  const first = { ...workflow({ name: "Legacy one" }), id: "legacy-recovery-1", ownerId: null };
  const second = { ...workflow({ name: "Legacy two" }), id: "legacy-recovery-2", ownerId: null };
  const owned = { ...workflow(), id: "already-owned", ownerId: "user-b" };
  saveWorkflow(first);
  saveWorkflow(second);
  saveWorkflow(owned);
  saveRun({ id: "legacy-recovery-run", workflowId: first.id, status: "success", startedAt: new Date().toISOString(), finishedAt: new Date().toISOString(), logs: [] });
  const preview = previewLegacyRecovery("operator@example.test", [first.id, second.id], "a@example.test", "Support ticket REC-1");
  assert.equal(preview.alreadyApplied, false);
  assert.deepEqual(listUnownedWorkflowIds().filter(id => id.startsWith("legacy-recovery-")).sort(), [first.id, second.id].sort());
  assert.equal(getWorkflowForOwner(first.id, "user-a"), undefined);
  assert.throws(() => reassignLegacyWorkflows(preview, false), /confirmation is required/);
  assert.equal(getWorkflowForOwner(first.id, "user-a"), undefined);
  assert.deepEqual(reassignLegacyWorkflows(preview, true), { changed: true, alreadyApplied: false });
  assert.equal(getWorkflowForOwner(first.id, "user-a")?.ownerId, "user-a");
  assert.equal(getWorkflowForOwner(second.id, "user-a")?.ownerId, "user-a");
  assert.equal(getRunForOwner("legacy-recovery-run", "user-a")?.workflowId, first.id);
  assert.equal(getRunForOwner("legacy-recovery-run", "user-b"), undefined);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM ownership_recovery_audit WHERE operation_key=?").get(preview.operationKey) as { count: number }).count, 1);
  assert.equal((db.prepare("SELECT workflow_ids_json, previous_owners_json, reason FROM ownership_recovery_audit WHERE operation_key=?").get(preview.operationKey) as { workflow_ids_json: string; previous_owners_json: string; reason: string }).workflow_ids_json.includes("Legacy"), false);
  assert.deepEqual(reassignLegacyWorkflows(preview, true), { changed: false, alreadyApplied: true });
  assert.throws(() => previewLegacyRecovery("operator@example.test", [first.id, owned.id], "a@example.test", "Support ticket REC-2"), /Owned workflows/);
  assert.equal(getWorkflowForOwner(owned.id, "user-b")?.ownerId, "user-b");
});

test("execution timeout is persisted as a failed run", () => {
  process.env.SKILLFORGE_MAX_EXECUTION_MS = "-1";
  const saved = workflow({ name: "Timeout workflow" });
  saveWorkflow(saved);
  const run = runWorkflow(saved.id, ownerId);
  assert.equal(run.status, "failed");
  assert.equal(run.error, "EXECUTION_TIMEOUT");
  delete process.env.SKILLFORGE_MAX_EXECUTION_MS;
});

test("execution concurrency quota rejects new work without creating a run", () => {
  process.env.SKILLFORGE_MAX_CONCURRENT_EXECUTIONS = "0";
  const saved = workflow({ name: "Quota workflow" });
  saveWorkflow(saved);
  assert.throws(() => runWorkflow(saved.id, ownerId), /EXECUTION_QUOTA_EXCEEDED/);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM runs WHERE workflow_id=?").get(saved.id) as { count: number }).count, 0);
  delete process.env.SKILLFORGE_MAX_CONCURRENT_EXECUTIONS;
});

test("seed is idempotent", () => {
  const env = { ...process.env, SKILLFORGE_DB_PATH: databasePath };
  execFileSync(process.execPath, ["scripts/seed.mjs"], { env, stdio: "ignore" });
  execFileSync(process.execPath, ["scripts/seed.mjs"], { env, stdio: "ignore" });
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM skills").get() as { count: number }).count, 9);
});
