import { NextResponse } from "next/server";
import { clearSessionCookies, invalidateSession, validateMutation } from "@/lib/auth";
export async function POST(request: Request) {
  const csrfError = validateMutation(request);
  if (csrfError) return NextResponse.json({ error: { code: "CSRF_REJECTED", message: csrfError } }, { status: 403 });
  invalidateSession(request);
  const response = NextResponse.json({ data: { loggedOut: true } });
  clearSessionCookies(response);
  return response;
}
