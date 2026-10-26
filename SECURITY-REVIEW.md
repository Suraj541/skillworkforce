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

Dependency audit still reports one high and one moderate transitive PostCSS/Next advisory. The available fix is a breaking Next upgrade and was not applied without a compatibility review. Resource limits are bounded for graph and field sizes, but rate limiting and execution quotas remain future deployment work.

Legacy workflows created before this change retain their data with `owner_id = NULL` and are intentionally inaccessible until an explicit claim/migration operation is designed.
