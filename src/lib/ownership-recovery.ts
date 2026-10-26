import { createHash } from "node:crypto";
import { db, findUserByEmail, getUser } from "./db";

export type RecoveryPreview = {
  operationKey: string;
  actor: string;
  workflowIds: string[];
  destinationUserId: string;
  destinationEmail: string;
  reason: string;
  alreadyApplied: boolean;
};

function normalizeIds(workflowIds: string[]) {
  const ids = workflowIds.map(id => id.trim()).filter(Boolean);
  if (!ids.length || new Set(ids).size !== ids.length) throw new Error("Provide one or more unique workflow IDs.");
  return ids;
}

function destinationUser(userIdOrEmail: string) {
  const user = getUser(userIdOrEmail.trim()) ?? findUserByEmail(userIdOrEmail.trim().toLowerCase());
  if (!user) throw new Error("Destination user does not exist.");
  return { id: user.id, email: user.email };
}

function operationKey(actor: string, workflowIds: string[], destinationUserId: string, reason: string) {
  return createHash("sha256").update(JSON.stringify([actor, [...workflowIds].sort(), destinationUserId, reason])).digest("hex");
}

function getOwnerlessWorkflows(workflowIds: string[]) {
  const placeholders = workflowIds.map(() => "?").join(",");
  const rows = db.prepare(`SELECT id, owner_id FROM workflows WHERE id IN (${placeholders})`).all(...workflowIds) as Array<{ id: string; owner_id: string | null }>;
  if (rows.length !== workflowIds.length) throw new Error("One or more workflow IDs do not exist.");
  if (rows.some(row => row.owner_id !== null)) throw new Error("Owned workflows cannot be reassigned.");
  return rows;
}

export function listUnownedWorkflowIds() {
  return (db.prepare("SELECT id FROM workflows WHERE owner_id IS NULL ORDER BY updated_at DESC").all() as Array<{ id: string }>).map(row => row.id);
}

export function previewLegacyRecovery(actor: string, workflowIds: string[], destination: string, reason: string): RecoveryPreview {
  const ids = normalizeIds(workflowIds);
  const user = destinationUser(destination);
  if (!actor.trim()) throw new Error("An operator identity is required.");
  if (!reason.trim()) throw new Error("A reason is required.");
  const key = operationKey(actor.trim(), ids, user.id, reason.trim());
  const alreadyApplied = Boolean(db.prepare("SELECT operation_key FROM ownership_recovery_audit WHERE operation_key=?").get(key));
  if (!alreadyApplied) getOwnerlessWorkflows(ids);
  return {
    operationKey: key,
    actor: actor.trim(),
    workflowIds: ids,
    destinationUserId: user.id,
    destinationEmail: user.email,
    reason: reason.trim(),
    alreadyApplied,
  };
}

export function reassignLegacyWorkflows(preview: RecoveryPreview, confirm: boolean) {
  if (!confirm) throw new Error("Explicit confirmation is required.");
  const existing = db.prepare("SELECT operation_key FROM ownership_recovery_audit WHERE operation_key=?").get(preview.operationKey);
  if (existing) return { changed: false, alreadyApplied: true };
  db.exec("BEGIN IMMEDIATE");
  try {
    const rows = getOwnerlessWorkflows(preview.workflowIds);
    for (const id of preview.workflowIds) {
      const result = db.prepare("UPDATE workflows SET owner_id=? WHERE id=? AND owner_id IS NULL").run(preview.destinationUserId, id);
      if (result.changes !== 1) throw new Error("Ownership changed while recovery was being confirmed.");
    }
    if (rows.length !== preview.workflowIds.length) throw new Error("Selected workflows changed while recovery was being confirmed.");
    db.prepare("INSERT INTO ownership_recovery_audit (operation_key, actor, workflow_ids_json, previous_owners_json, new_owner_id, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(preview.operationKey, preview.actor, JSON.stringify(preview.workflowIds), JSON.stringify(Object.fromEntries(preview.workflowIds.map(id => [id, null]))), preview.destinationUserId, preview.reason, new Date().toISOString());
    db.exec("COMMIT");
    return { changed: true, alreadyApplied: false };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
