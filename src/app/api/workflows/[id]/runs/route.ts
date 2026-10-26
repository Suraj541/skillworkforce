import { NextResponse } from "next/server";
import { listRuns } from "@/lib/db";
import { runWorkflow } from "@/lib/engine";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { return NextResponse.json({ data: listRuns((await params).id) }); }
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { return NextResponse.json({ data: runWorkflow((await params).id) }, { status: 201 }); }
  catch (error) { const code = error instanceof Error ? error.message : "RUN_FAILED"; return NextResponse.json({ error: { code, message: "Unable to run workflow." } }, { status: code === "WORKFLOW_NOT_FOUND" ? 404 : 422 }); }
}
