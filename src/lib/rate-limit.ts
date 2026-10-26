type Entry = { count: number; resetAt: number };

const entries = new Map<string, Entry>();

function setting(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function cleanup(now: number) {
  for (const [key, entry] of entries) if (entry.resetAt <= now) entries.delete(key);
}

export function rateLimit(key: string, configuredLimit: number, configuredWindowMs: number) {
  const now = Date.now();
  cleanup(now);
  const limit = setting("SKILLFORGE_RATE_LIMIT", configuredLimit);
  const windowMs = setting("SKILLFORGE_RATE_WINDOW_MS", configuredWindowMs);
  const entry = entries.get(key);
  if (!entry || entry.resetAt <= now) {
    entries.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }
  entry.count += 1;
  return { allowed: entry.count <= limit, retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
}

export function requestSource(request: Request) {
  if (process.env.SKILLFORGE_TRUST_PROXY === "true") return request.headers.get("x-real-ip")?.trim() || "trusted-proxy-unknown";
  return "direct-client";
}

export function clearRateLimitsForTests() {
  entries.clear();
}
