import { NextResponse } from "next/server";
import { getRunForOwner } from "@/lib/db";
import { requireUser } from "@/lib/auth";
export async function GET(_: Request, { params }: { params: Promise<{ runId: string }> }) {
  const auth = await requireUser(_);
  if ("response" in auth) return auth.response;
  const run = getRunForOwner((await params).runId, auth.user.id);
  return run ? NextResponse.json({ data: run }) : NextResponse.json({ error: { code: "NOT_FOUND", message: "Run not found." } }, { status: 404 });
}
