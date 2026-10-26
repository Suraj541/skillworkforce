# Architecture

The app uses Next.js App Router with a client workflow editor and server route handlers. `src/lib/types.ts` contains shared graph/run types; `src/lib/node-catalog.ts` is the registry; `src/lib/engine.ts` validates and executes supported nodes; `src/lib/db.ts` owns the local `node:sqlite` database and schema initialization.

The initial vertical slice intentionally keeps the graph JSON in a normalized workflow row and stores runs separately. This is reversible: node/edge tables can be added later without changing route contracts. External content is not executed; the current engine only transforms configured text and writes a fixed-entry ZIP artifact.

Development and production scripts bind to loopback to reduce accidental exposure. Application-level identity, ownership checks, and CSRF protection are now present, but shared deployment still requires operational hardening.

## Identity and authorization

Users are stored in SQLite with scrypt password hashes. Login creates a random opaque session token; only its SHA-256 hash is stored in `sessions`. The session is HttpOnly, SameSite=Lax, Secure in production, and expires after eight hours. A separate readable CSRF cookie is bound to the session by hash and must be echoed in `x-csrf-token`.

Every workflow has an `owner_id`; list/read/update/delete/validate/run operations query through the authenticated owner. Runs inherit authorization through their parent workflow. Existing rows from the pre-auth schema are migrated with `owner_id = NULL`, preserved, and denied to all users until an explicit future claim flow exists; no account is silently assigned.

State-changing requests require the exact `SKILLFORGE_APP_ORIGIN` (default `http://127.0.0.1:3000`) and the CSRF double-submit check. This is a cookie-session threat model; CORS is not used as the CSRF defense.

Login attempts are limited in-process by both a source bucket and normalized account identifier. Workflow creation, validation, and execution have per-user request limits. The source address is not taken from forwarded headers unless `SKILLFORGE_TRUST_PROXY=true`; otherwise all direct requests use the local-client bucket. These limits are bounded abuse resistance for a single process, not a cluster-wide control.

Execution enforces configurable in-process per-user/global concurrency counters, a duration check, log count, graph validation, and ZIP size limits. The current synchronous engine cannot cancel work already executing or recover an in-flight run after process termination; durable workers remain a roadmap item.

Responses include `X-Content-Type-Options`, strict referrer policy, frame denial, and a restrictive permissions policy. HSTS is opt-in through `SKILLFORGE_ENABLE_HSTS=true` only when TLS is guaranteed. A CSP is not asserted because the current client resource requirements have not been independently tested against a complete policy.

## Legacy ownership recovery

There is no public recovery API and no administrator role in the local MVP. An operator with access to the database host may use `npm run ownership:recover` to list ownerless workflow IDs, preview a specific reassignment, and apply it only with `--confirm`. The command requires an existing destination user, explicit IDs, an operator identity, and a reason. It rechecks that every selected workflow is still ownerless inside a `BEGIN IMMEDIATE` transaction, preserves all related runs and logs, and writes one `ownership_recovery_audit` event keyed for safe retries. Audit records contain IDs and ownership metadata only, never passwords, sessions, or graph content.
