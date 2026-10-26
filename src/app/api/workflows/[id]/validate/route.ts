import { NextResponse } from "next/server";
import { getWorkflow } from "@/lib/db";
import { validateWorkflow } from "@/lib/engine";
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const workflow = getWorkflow((await params).id);
  if (!workflow) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Workflow not found." } }, { status: 404 });
  return NextResponse.json({ data: validateWorkflow(workflow) });
}
