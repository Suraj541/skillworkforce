# Security review

## Scope and evidence

This review covered the local Next.js route handlers, workflow engine, SQLite persistence, ZIP generation, client rendering, and seed script. Testing was limited to controlled local fixtures; no external scanning or remote source access was performed.

## Findings

| # | Severity | File | Lines | Vulnerability | Confidence |
|---|----------|------|-------|---------------|------------|
| 1 | 🟠 HIGH | `src/app/api/workflows/route.ts`, `src/app/api/workflows/[id]/route.ts`, `src/app/api/workflows/[id]/runs/route.ts`, `src/app/api/runs/[runId]/route.ts` | route handlers | No authentication, authorization, ownership checks, or CSRF protection. Any client that can reach the server can read, modify, execute, and inspect workflow data. | 10/10 |

## Remediation

- The MVP is explicitly local-only and the `dev` and `start` scripts now bind to `127.0.0.1`.
- Shared deployment remains blocked until authentication, per-workflow ownership/access checks, and CSRF protection are implemented.
- Workflow request schemas now reject malformed JSON, unknown fields, unsupported nodes, oversized graph/config values, duplicate IDs, broken edges, and cycles before execution.
- Execution uses validated topological order and stops at the security gate.
- ZIP output uses fixed internal filenames and is generated without archive extraction or execution.
- SQL uses parameter binding; React output uses escaped JSX; no SSRF or arbitrary code execution path exists in the current scope.

## Verification

`npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` pass. Behavioral tests cover successful execution and ZIP contents, malformed JSON, duplicate nodes, broken edges, cycles, unsupported nodes, security-gate failure, and idempotent seeding. The HTTP workflow route set was exercised locally, and the browser workflow smoke test persisted and displayed a successful run after refresh.

## Remaining risks

Dependency audit still reports one high and one moderate transitive PostCSS/Next advisory. The available fix is a breaking Next upgrade and was not applied without a compatibility review. Resource limits are bounded for graph and field sizes, but rate limiting and execution quotas remain future deployment work.
