import { NextResponse } from "next/server";
import { listRunsForOwner, getWorkflowForOwner } from "@/lib/db";
import { runWorkflow } from "@/lib/engine";
import { requireUser, validateMutation } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;
  const id = (await params).id;
  if (!getWorkflowForOwner(id, auth.user.id)) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Workflow not found." } }, { status: 404 });
  return NextResponse.json({ data: listRunsForOwner(id, auth.user.id) });
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;
  const csrfError = validateMutation(request);
  if (csrfError) return NextResponse.json({ error: { code: "CSRF_REJECTED", message: csrfError } }, { status: 403 });
  const limit = rateLimit(`run:user:${auth.user.id}`, 20, 60 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Too many workflow executions. Try again later." } }, { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } });
  const id = (await params).id;
  if (!getWorkflowForOwner(id, auth.user.id)) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Workflow not found." } }, { status: 404 });
  try { return NextResponse.json({ data: runWorkflow(id, auth.user.id) }, { status: 201 }); }
  catch (error) { const code = error instanceof Error ? error.message : "RUN_FAILED"; return NextResponse.json({ error: { code, message: code === "EXECUTION_QUOTA_EXCEEDED" ? "Workflow execution capacity is currently full." : "Unable to run workflow." } }, { status: code === "WORKFLOW_NOT_FOUND" ? 404 : code === "EXECUTION_QUOTA_EXCEEDED" ? 429 : 422 }); }
}
