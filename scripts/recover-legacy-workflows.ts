import { listUnownedWorkflowIds, previewLegacyRecovery, reassignLegacyWorkflows } from "../src/lib/ownership-recovery";

const args = process.argv.slice(2);
const has = (name: string) => args.includes(name);
function value(name: string) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

if (has("--list")) {
  for (const id of listUnownedWorkflowIds()) console.log(id);
  process.exit(0);
}

const workflowIds = args.flatMap((arg, index) => arg === "--workflow" && args[index + 1] ? [args[index + 1]] : []);
const actor = value("--operator");
const destination = value("--to-user");
const reason = value("--reason");
if (!actor || !destination || !reason || !workflowIds.length) {
  throw new Error("Usage: recover-legacy-workflows.ts --operator <operator> --to-user <user-id-or-email> --reason <reason> --workflow <id> [--workflow <id>] [--dry-run|--confirm]");
}

const preview = previewLegacyRecovery(actor, workflowIds, destination, reason);
console.log(JSON.stringify(preview, null, 2));
if (has("--dry-run")) process.exit(0);
if (!has("--confirm")) throw new Error("Use --dry-run to preview or --confirm to apply the reassignment.");
console.log(JSON.stringify(reassignLegacyWorkflows(preview, true), null, 2));
const remaining = listUnownedWorkflowIds();
console.log(`Unassigned workflows remaining: ${remaining.length}`);
for (const id of remaining) console.log(id);
