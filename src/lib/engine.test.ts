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

function workflow(overrides: Partial<typeof defaultWorkflow> = {}) {
  return { id: crypto.randomUUID(), ...defaultWorkflow, ...overrides, version: 1, status: "draft" as const, updatedAt: new Date().toISOString() };
}

test.before(async () => {
  ({ db, saveWorkflow } = await import("./db"));
  ({ runWorkflow, validateWorkflow } = await import("./engine"));
  ({ defaultWorkflow } = await import("./node-catalog"));
  ({ POST: createWorkflow } = await import("../app/api/workflows/route"));
});
test.after(() => rmSync(path.dirname(databasePath), { recursive: true, force: true }));

test("valid workflow executes in topological order and creates a readable ZIP", () => {
  const saved = workflow();
  saveWorkflow(saved);
  const run = runWorkflow(saved.id);
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
  const run = runWorkflow(saved.id);
  assert.equal(run.status, "failed");
  assert.equal(run.error, "SECURITY_GATE_BLOCKED");
  assert.equal(run.artifact, undefined);
});

test("create route rejects malformed JSON with a stable error envelope", async () => {
  const response = await createWorkflow(new Request("http://localhost/api/workflows", { method: "POST", body: "{", headers: { "content-type": "application/json" } }));
  assert.equal(response.status, 400);
  assert.deepEqual((await response.json()).error.code, "INVALID_JSON");
});

test("seed is idempotent", () => {
  const env = { ...process.env, SKILLFORGE_DB_PATH: databasePath };
  execFileSync(process.execPath, ["scripts/seed.mjs"], { env, stdio: "ignore" });
  execFileSync(process.execPath, ["scripts/seed.mjs"], { env, stdio: "ignore" });
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM skills").get() as { count: number }).count, 9);
});
