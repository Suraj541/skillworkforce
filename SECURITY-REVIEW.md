# Security review

## Scope and evidence

This review covered the local Next.js route handlers, workflow engine, SQLite persistence, ZIP generation, client rendering, and seed script. Testing was limited to controlled local fixtures; no external scanning or remote source access was performed.

## Findings

| # | Severity | File | Lines | Vulnerability | Confidence |
|---|----------|------|-------|---------------|------------|
| 1 | 🟠 HIGH | `src/app/api/workflows/route.ts`, `src/app/api/workflows/[id]/route.ts`, `src/app/api/workflows/[id]/runs/route.ts`, `src/app/api/runs/[runId]/route.ts` | route handlers | No authentication, authorization, ownership checks, or CSRF protection. Any client that can reach the server can read, modify, execute, and inspect workflow data. | 10/10 |

## Remediation

- The MVP is explicitly local-only and the `dev` and `start` scripts now bind to `127.0.0.1`.
- Workflow/run APIs now require opaque server-side sessions, owner checks, and CSRF/origin validation.
- Shared deployment still requires operational secret management, HTTPS, rate limiting, and review of the unresolved dependency advisories.
- Workflow request schemas now reject malformed JSON, unknown fields, unsupported nodes, oversized graph/config values, duplicate IDs, broken edges, and cycles before execution.
- Execution uses validated topological order and stops at the security gate.
- ZIP output uses fixed internal filenames and is generated without archive extraction or execution.
- SQL uses parameter binding; React output uses escaped JSX; no SSRF or arbitrary code execution path exists in the current scope.
- Authentication uses scrypt password hashes, HttpOnly session cookies, eight-hour expiry, session invalidation on logout, and a non-public bootstrap command.

## Verification

`npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` pass. Behavioral tests cover successful execution and ZIP contents, malformed JSON, duplicate nodes, broken edges, cycles, unsupported nodes, security-gate failure, idempotent seeding, unauthenticated access, owner isolation, IDOR attempts, invalid CSRF, and authenticated workflow execution.

## Remaining risks

Resource limits are bounded for graph and field sizes, but rate limiting and execution quotas remain future deployment work.

Legacy workflows created before this change retain their data with `owner_id = NULL` and are intentionally inaccessible until an explicit claim/migration operation is designed.

## Legacy ownership recovery

Legacy ownership is recovered only through the operator-only `npm run ownership:recover` CLI; no authenticated user or public API can claim records. Back up `SKILLFORGE_DB_PATH` before recovery. List candidates with `npm run ownership:recover -- --list`, preview with `--operator <operator> --to-user <user-id-or-email> --reason <reason> --workflow <id> --dry-run`, then apply the exact preview inputs with `--confirm`. The command rejects duplicate, missing, nonexistent, or already-owned IDs and nonexistent destination users. Reassignment is transactional, rechecks ownerless state immediately before updates, preserves runs/logs, and records the operator, IDs, previous ownership, destination, reason, timestamp, and an idempotency key in `ownership_recovery_audit`. Historical ownership that cannot be established remains an explicit administrative decision rather than an inferred assignment.

## Dependency advisory remediation

Before remediation, `next@15.5.28` installed `postcss@8.4.31` through `next -> postcss`. `npm audit --omit=dev` reported:

- `GHSA-qx2v-qp2m-jg93` — PostCSS XSS, fixed in `8.5.10`.
- `GHSA-6g55-p6wh-862q` — arbitrary source-map file read, fixed after `8.5.11`.
- `GHSA-fxqj-rqcc-2cmp` — incomplete source-map fix, affected through `8.5.22`.
- `GHSA-r28c-9q8g-f849` — source-map path traversal, affected through `8.5.17`.

The smallest compatible fix is the npm override `"postcss": "8.5.31"`. It preserves Next `15.5.28`, installs `postcss@8.5.31` in the actual dependency tree, and covers all four affected ranges. `npm audit --omit=dev --audit-level=high` and `npm audit --omit=dev` both report zero vulnerabilities after the override. No Next major upgrade was required.

The advisories concern PostCSS source-map processing of attacker-controlled CSS. This application does not process user-controlled CSS; its runtime inputs are JSON workflow data, and PostCSS is used by the build toolchain. The dependency remains patched regardless of that conditional reachability assessment.

## Final hardening

- Login attempts are limited by source bucket and normalized account identifier, with generic `429` responses and expiry cleanup. Forwarded addresses are ignored unless `SKILLFORGE_TRUST_PROXY=true`.
- Workflow creation, validation, and execution have per-user in-process limits. Execution also has per-user/global concurrency counters, duration, log, graph, and archive-size bounds. These controls do not provide cluster-wide enforcement and do not cancel synchronous work after process termination.
- Security response headers include content-type sniffing protection, referrer policy, frame denial, and permissions policy. HSTS is opt-in only when HTTPS is guaranteed. CSP remains intentionally unconfigured pending browser-resource testing.
- SQLite backups use `VACUUM INTO`; restore validates `PRAGMA integrity_check` and should target an isolated path first.
- The corrected advisory identifier is `GHSA-qx2v-qp2m-jg93`; prior documentation that used `GHSA-qx2v-qp93-jg93` was a transcription error.
- Required production configuration can be enabled with `SKILLFORGE_REQUIRE_PRODUCTION_CONFIG=true`; startup then requires an HTTPS `SKILLFORGE_APP_ORIGIN` and explicit HSTS enablement. The default remains loopback/local-development compatible.

## Framework support status

The official Next.js support policy indicates that Next 15 maintenance support ended on 2026-10-21. The installed `next@15.5.28` remains audit-clean and passed all local checks, but it is no longer an appropriate baseline for internet-facing or shared staging deployment. A controlled Next 16 migration is therefore a required follow-up before those deployment targets; this task intentionally did not combine that disruptive framework migration with unrelated hardening.
