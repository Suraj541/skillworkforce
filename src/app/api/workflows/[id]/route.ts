import { NextResponse } from "next/server";
import { deleteWorkflow, getWorkflowForOwner, saveWorkflow } from "@/lib/db";
import type { Workflow } from "@/lib/types";
import { errorDetails, updateWorkflowSchema, workflowGraphSchema } from "@/lib/validation";
import { requireUser, validateMutation } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const request = _;
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;
  const workflow = getWorkflowForOwner((await params).id, auth.user.id);
  return workflow ? NextResponse.json({ data: workflow }) : NextResponse.json({ error: { code: "NOT_FOUND", message: "Workflow not found." } }, { status: 404 });
}
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;
  const csrfError = validateMutation(request);
  if (csrfError) return NextResponse.json({ error: { code: "CSRF_REJECTED", message: csrfError } }, { status: 403 });
  const id = (await params).id; const current = getWorkflowForOwner(id, auth.user.id);
  if (!current) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Workflow not found." } }, { status: 404 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } }, { status: 400 }); }
  const parsed = updateWorkflowSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Workflow update is invalid.", details: errorDetails(parsed.error) } }, { status: 400 });
  const graph = parsed.data.nodes || parsed.data.edges ? workflowGraphSchema.safeParse({ nodes: parsed.data.nodes ?? current.nodes, edges: parsed.data.edges ?? current.edges }) : { success: true as const, data: undefined };
  if (!graph.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Workflow graph is invalid.", details: errorDetails(graph.error) } }, { status: 400 });
  const workflow: Workflow = { ...current, ...parsed.data, ...(graph.data ?? {}), id, version: current.version + 1, updatedAt: new Date().toISOString() };
  saveWorkflow(workflow); return NextResponse.json({ data: workflow });
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(request);
  if ("response" in auth) return auth.response;
  const csrfError = validateMutation(request);
  if (csrfError) return NextResponse.json({ error: { code: "CSRF_REJECTED", message: csrfError } }, { status: 403 });
  const deleted = deleteWorkflow((await params).id, auth.user.id);
  return deleted ? NextResponse.json({ data: { deleted: true } }) : NextResponse.json({ error: { code: "NOT_FOUND", message: "Workflow not found." } }, { status: 404 });
}
