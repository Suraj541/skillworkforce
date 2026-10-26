import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const [backup, destination = process.env.SKILLFORGE_DB_PATH ?? path.join(process.cwd(), "data", "skillforge.db")] = process.argv.slice(2);
if (!backup) throw new Error("Usage: node scripts/restore-db.mjs <backup-path> [destination-path]");
const check = new DatabaseSync(backup);
const result = check.prepare("PRAGMA integrity_check").get();
check.close();
if (!result || Object.values(result)[0] !== "ok") throw new Error("Backup failed SQLite integrity_check.");
mkdirSync(path.dirname(path.resolve(destination)), { recursive: true });
copyFileSync(backup, destination);
console.log(`Restored SQLite backup to ${path.resolve(destination)}`);
