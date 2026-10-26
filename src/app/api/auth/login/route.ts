import { NextResponse } from "next/server";
import { createSession, invalidateSession, login, setSessionCookies, validateOrigin } from "@/lib/auth";

export async function POST(request: Request) {
  const originError = validateOrigin(request);
  if (originError) return NextResponse.json({ error: { code: "CSRF_REJECTED", message: originError } }, { status: 403 });
  const body = await request.json().catch(() => null) as { email?: unknown; password?: unknown } | null;
  if (typeof body?.email !== "string" || typeof body.password !== "string") return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Email and password are required." } }, { status: 400 });
  const user = login(body.email, body.password);
  if (!user) return NextResponse.json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials." } }, { status: 401 });
  invalidateSession(request);
  const session = createSession(user);
  const response = NextResponse.json({ data: user });
  setSessionCookies(response, session.session, session.csrf);
  return response;
}
