import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
export async function GET(request: Request) {
  const auth = await requireUser(request);
  return "response" in auth ? auth.response : NextResponse.json({ data: auth.user });
}
