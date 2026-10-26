import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { SOP_SEED_VERSION, SOP_SKILLS } from "./seed-sop";

const DB_PATH = join(process.cwd(), "data", "skillforge.db");
mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  source_note TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  version INTEGER NOT NULL,
  graph_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workflow_runs (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  workflow_version INTEGER NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  duration_ms INTEGER,
  logs_json TEXT NOT NULL,
  artifacts_json TEXT NOT NULL,
  error_code TEXT,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id)
);

CREATE TABLE IF NOT EXISTS workflow_node_runs (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  node_type TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  duration_ms INTEGER,
  input_json TEXT NOT NULL,
  output_json TEXT NOT NULL,
  logs_json TEXT NOT NULL,
  error_code TEXT,
  FOREIGN KEY (run_id) REFERENCES workflow_runs(id)
);

CREATE TABLE IF NOT EXISTS seed_metadata (
  id TEXT PRIMARY KEY,
  seed_name TEXT NOT NULL UNIQUE,
  seed_version TEXT NOT NULL,
  seeded_at TEXT NOT NULL
);
`);

const seedMeta = db
  .prepare("SELECT seed_version FROM seed_metadata WHERE seed_name = ?")
  .get("ai-usage-sop-pack") as { seed_version: string } | undefined;

if (!seedMeta || seedMeta.seed_version !== SOP_SEED_VERSION) {
  const now = new Date().toISOString();
  const upsert = db.prepare(`
    INSERT INTO skills (id, slug, name, description, source_kind, source_note, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      source_kind = excluded.source_kind,
      source_note = excluded.source_note,
      updated_at = excluded.updated_at
  `);

  db.exec("BEGIN");
  try {
    for (const skill of SOP_SKILLS) {
      upsert.run(
        randomUUID(),
        skill.slug,
        skill.title,
        skill.description,
        "seeded",
        skill.kind === "core"
          ? "Source: ChatGPT_Usage_SOP family (core nine skills)."
          : "Source: ChatGPT_Usage_SOP_Expanded family (appendix workflow templates).",
        now,
        now,
      );
    }

    db.prepare(
      `INSERT INTO seed_metadata (id, seed_name, seed_version, seeded_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(seed_name) DO UPDATE SET seed_version = excluded.seed_version, seeded_at = excluded.seeded_at`,
    ).run(randomUUID(), "ai-usage-sop-pack", SOP_SEED_VERSION, now);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export { db };
