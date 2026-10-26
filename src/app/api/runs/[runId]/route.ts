import { NextResponse } from "next/server";
import { getRun } from "@/lib/db";
export async function GET(_: Request, { params }: { params: Promise<{ runId: string }> }) {
  const run = getRun((await params).runId);
  return run ? NextResponse.json({ data: run }) : NextResponse.json({ error: { code: "NOT_FOUND", message: "Run not found." } }, { status: 404 });
}
