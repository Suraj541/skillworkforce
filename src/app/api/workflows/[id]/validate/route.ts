import { NextResponse } from "next/server";
import { getWorkflow } from "@/lib/db";
import { validateWorkflow } from "@/lib/engine";
import { requireUser, validateMutation } from "@/lib/auth";
import { getWorkflowForOwner } from "@/lib/db";
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(_);
  if ("response" in auth) return auth.response;
  const csrfError = validateMutation(_);
  if (csrfError) return NextResponse.json({ error: { code: "CSRF_REJECTED", message: csrfError } }, { status: 403 });
  const workflow = getWorkflowForOwner((await params).id, auth.user.id);
  if (!workflow) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Workflow not found." } }, { status: 404 });
  return NextResponse.json({ data: validateWorkflow(workflow) });
}
