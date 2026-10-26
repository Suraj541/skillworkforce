import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const source = process.env.SKILLFORGE_DB_PATH ?? path.join(process.cwd(), "data", "skillforge.db");
const destination = process.argv[2];
if (!destination) throw new Error("Usage: node scripts/backup-db.mjs <backup-path>");
mkdirSync(path.dirname(path.resolve(destination)), { recursive: true });
const db = new DatabaseSync(source);
const result = db.prepare("PRAGMA integrity_check").get();
if (!result || Object.values(result)[0] !== "ok") throw new Error("Source database failed SQLite integrity_check.");
db.exec(`VACUUM INTO '${path.resolve(destination).replaceAll("'", "''")}'`);
db.close();
console.log(`Created SQLite backup at ${path.resolve(destination)}`);
