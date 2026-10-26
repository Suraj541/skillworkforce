import { NextResponse } from "next/server";
import { createSession, invalidateSession, login, setSessionCookies, validateOrigin } from "@/lib/auth";
import { rateLimit, requestSource } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const originError = validateOrigin(request);
  if (originError) return NextResponse.json({ error: { code: "CSRF_REJECTED", message: originError } }, { status: 403 });
  const body = await request.json().catch(() => null) as { email?: unknown; password?: unknown } | null;
  if (typeof body?.email !== "string" || typeof body.password !== "string") return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Email and password are required." } }, { status: 400 });
  const account = body.email.trim().toLowerCase();
  const sourceLimit = rateLimit(`login:source:${requestSource(request)}`, 10, 15 * 60 * 1000);
  const accountLimit = rateLimit(`login:account:${account}`, 5, 15 * 60 * 1000);
  if (!sourceLimit.allowed || !accountLimit.allowed) {
    return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Too many login attempts. Try again later." } }, { status: 429, headers: { "retry-after": String(Math.max(sourceLimit.retryAfterSeconds, accountLimit.retryAfterSeconds)) } });
  }
  const user = login(account, body.password);
  if (!user) return NextResponse.json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials." } }, { status: 401 });
  invalidateSession(request);
  const session = createSession(user);
  const response = NextResponse.json({ data: user });
  setSessionCookies(response, session.session, session.csrf);
  return response;
}
