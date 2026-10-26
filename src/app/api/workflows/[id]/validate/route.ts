import { NextResponse } from "next/server";
import { getWorkflow } from "@/lib/db";
import { validateWorkflow } from "@/lib/engine";
import { requireUser, validateMutation } from "@/lib/auth";
import { getWorkflowForOwner } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(_);
  if ("response" in auth) return auth.response;
  const csrfError = validateMutation(_);
  if (csrfError) return NextResponse.json({ error: { code: "CSRF_REJECTED", message: csrfError } }, { status: 403 });
  const limit = rateLimit(`validate:user:${auth.user.id}`, 60, 60 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Too many validation requests. Try again later." } }, { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } });
  const workflow = getWorkflowForOwner((await params).id, auth.user.id);
  if (!workflow) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Workflow not found." } }, { status: 404 });
  return NextResponse.json({ data: validateWorkflow(workflow) });
}
