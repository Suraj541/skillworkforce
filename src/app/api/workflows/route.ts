import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { listWorkflows, saveWorkflow } from "@/lib/db";
import { defaultWorkflow } from "@/lib/node-catalog";
import type { Workflow } from "@/lib/types";
import { createWorkflowSchema, errorDetails } from "@/lib/validation";
import { requireUser, validateMutation } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  return "response" in auth ? auth.response : NextResponse.json({ data: listWorkflows(auth.user.id) });
}
export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;
  const csrfError = validateMutation(request);
  if (csrfError) return NextResponse.json({ error: { code: "CSRF_REJECTED", message: csrfError } }, { status: 403 });
  const limit = rateLimit(`create:user:${auth.user.id}`, 30, 60 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Too many workflow creations. Try again later." } }, { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } }, { status: 400 }); }
  const parsed = createWorkflowSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Workflow input is invalid.", details: errorDetails(parsed.error) } }, { status: 400 });
  const now = new Date().toISOString();
  const workflow: Workflow = { id: randomUUID(), ownerId: auth.user.id, name: parsed.data.name ?? defaultWorkflow.name, description: parsed.data.description ?? defaultWorkflow.description, version: 1, status: "draft", nodes: defaultWorkflow.nodes, edges: defaultWorkflow.edges, updatedAt: now };
  saveWorkflow(workflow);
  return NextResponse.json({ data: workflow }, { status: 201 });
}
