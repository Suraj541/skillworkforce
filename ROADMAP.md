# SkillForge AI roadmap

This backlog is intentionally separate from the secure local workflow slice. Each item must preserve server-side authorization, untrusted-content handling, and deterministic failure reporting.

| Priority | Feature | User value | Security/dependencies | Acceptance and tests | Deployment need |
|---|---|---|---|---|---|
| P0 | Durable execution worker and cancellation | Stop long runs and recover queued work after restart | Requires a queue/worker boundary, durable run state, ownership checks, and cancellation tokens | Restart recovery, timeout, cancellation, duplicate-submission, and artifact cleanup tests | Required before internet-facing long-running workloads |
| P0 | Next 16 framework migration | Return to a supported framework security-update line | Major-version migration and route/browser regression review; current Next 15.5.28 is beyond its 2026-10-21 maintenance window | Official migration checklist, npm audits, build, API/auth/browser smoke, and rollback validation | Required before shared staging or internet-facing deployment |
| P1 | Secure ZIP import | Bring existing skills into the library | Path traversal, archive bombs, file/type limits, content scanning, and no automatic execution | Malformed, oversized, traversal, symlink, and archive-integrity fixtures | Secure product capability; not required for current private use |
| P1 | Account recovery and operator rotation | Recover access without database editing | Requires a verified operator process and secret-management integration; no public claim flow | Expiry, one-time token, invalidation, audit, and enumeration tests | Required for shared staging; optional for single-operator local use |
| P2 | Skill library and projects | Organize reusable skills and project context | New ownership tables and object-level authorization | Search/filter, cross-user isolation, persistence, and import provenance tests | Product functionality |
| P2 | Discovery/search | Find supported public skills | Requires SSRF-safe fetch policy, source provenance, content limits, and review-before-import | URL policy, redirect, timeout, content, and provenance tests | Product functionality; not enabled today |
| P3 | Provider adapters | Use optional AI-assisted composition | Requires provider secret management, redaction, quotas, and deterministic fallback | Mock adapter contract, failure, timeout, and secret-redaction tests | Optional product functionality |
| P3 | Expanded SOP templates | Broader curriculum coverage | Source documents and provenance must be available; do not fabricate missing templates | Seed idempotency and content provenance tests | Optional product functionality |
