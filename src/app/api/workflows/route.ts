import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { listWorkflows, saveWorkflow } from "@/lib/db";
import { defaultWorkflow } from "@/lib/node-catalog";
import type { Workflow } from "@/lib/types";
import { createWorkflowSchema, errorDetails } from "@/lib/validation";

export function GET() { return NextResponse.json({ data: listWorkflows() }); }
export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } }, { status: 400 }); }
  const parsed = createWorkflowSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Workflow input is invalid.", details: errorDetails(parsed.error) } }, { status: 400 });
  const now = new Date().toISOString();
  const workflow: Workflow = { id: randomUUID(), name: parsed.data.name ?? defaultWorkflow.name, description: parsed.data.description ?? defaultWorkflow.description, version: 1, status: "draft", nodes: defaultWorkflow.nodes, edges: defaultWorkflow.edges, updatedAt: now };
  saveWorkflow(workflow);
  return NextResponse.json({ data: workflow }, { status: 201 });
}
