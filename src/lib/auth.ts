import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteSession, findUserByEmail, getSession, getUser, saveSession } from "./db";
import type { User } from "./types";

const SESSION_COOKIE = "skillforge_session";
const CSRF_COOKIE = "skillforge_csrf";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const appOrigin = process.env.SKILLFORGE_APP_ORIGIN ?? "http://127.0.0.1:3000";

function hash(value: string) { return createHash("sha256").update(value).digest("hex"); }
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password: string, stored: string) {
  const [salt, digest] = stored.split(":");
  if (!salt || !digest) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(digest, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function cookieOptions(httpOnly: boolean) {
  return { httpOnly, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_TTL_MS / 1000 };
}
export function setSessionCookies(response: NextResponse, session: string, csrf: string) {
  response.cookies.set(SESSION_COOKIE, session, cookieOptions(true));
  response.cookies.set(CSRF_COOKIE, csrf, cookieOptions(false));
}
export function clearSessionCookies(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions(true), maxAge: 0 });
  response.cookies.set(CSRF_COOKIE, "", { ...cookieOptions(false), maxAge: 0 });
}
export function createSession(user: User) {
  const session = randomBytes(32).toString("base64url");
  const csrf = randomBytes(32).toString("base64url");
  const now = new Date();
  saveSession(hash(session), user.id, hash(csrf), now.toISOString(), new Date(now.getTime() + SESSION_TTL_MS).toISOString());
  return { session, csrf };
}
export async function currentUser(request: Request): Promise<User | undefined> {
  const token = request.headers.get("cookie")?.match(/(?:^|;\s*)skillforge_session=([^;]+)/)?.[1];
  if (!token) return undefined;
  const session = getSession(hash(decodeURIComponent(token)));
  if (!session || Date.parse(session.expires_at) <= Date.now()) {
    if (session) deleteSession(session.id_hash);
    return undefined;
  }
  return getUser(session.user_id);
}
export async function requireUser(request: Request) {
  const user = await currentUser(request);
  return user ? { user } : { response: NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Authentication required." } }, { status: 401 }) };
}
export function validateMutation(request: Request) {
  const originError = validateOrigin(request);
  if (originError) return originError;
  const cookie = request.headers.get("cookie")?.match(/(?:^|;\s*)skillforge_csrf=([^;]+)/)?.[1];
  const header = request.headers.get("x-csrf-token");
  if (!cookie || !header || cookie.length !== header.length || !timingSafeEqual(Buffer.from(cookie), Buffer.from(header))) return "CSRF token is invalid.";
  const sessionToken = request.headers.get("cookie")?.match(/(?:^|;\s*)skillforge_session=([^;]+)/)?.[1];
  const session = sessionToken ? getSession(hash(decodeURIComponent(sessionToken))) : undefined;
  if (!session || session.csrf_hash !== hash(cookie)) return "CSRF token is invalid.";
  return undefined;
}
export function validateOrigin(request: Request) {
  return request.headers.get("origin") === appOrigin ? undefined : "Request origin is not trusted.";
}
export function login(email: string, password: string) {
  const user = findUserByEmail(email.trim().toLowerCase());
  return user && verifyPassword(password, user.passwordHash) ? { id: user.id, email: user.email, createdAt: user.createdAt } : undefined;
}
export function invalidateSession(request: Request) {
  const token = request.headers.get("cookie")?.match(/(?:^|;\s*)skillforge_session=([^;]+)/)?.[1];
  if (token) deleteSession(hash(decodeURIComponent(token)));
}
export async function clearServerCookieSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(CSRF_COOKIE);
}
