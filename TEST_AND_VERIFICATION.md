# Test and verification

## Commands

```bash
npm install
npm run db:init
npm run db:seed
npm run auth:bootstrap
npm run typecheck
npm test
npm run build
npm run dev
```

## Evidence policy

Unit/integration checks establish service and persistence behavior; they do not prove the rendered UI. Browser status must be recorded separately. Endpoint exercise coverage is the count of registered route/method pairs called by tests, not line or branch coverage.

## Current status

Baseline checks were unavailable before the empty repository received a package manifest. Current checks: lint passed, typecheck passed, nine behavioral regression tests passed, production build passed, database init/seed passed, successful ZIP integrity check passed, security-gate blocking passed, seed idempotency passed, authenticated owner/CSRF route behavior passed, legacy migration preservation passed, and browser login/workflow execution passed. `npm audit --omit=dev --audit-level=high` remains blocked by one high and one moderate transitive vulnerability in the current Next/PostCSS dependency tree; a forced fix would upgrade Next across a breaking-version boundary.

## Migration behavior

Database initialization creates `schema_migrations`, `users`, and `sessions`, then adds `workflows.owner_id` if it is missing. Existing workflows and runs are preserved. Legacy workflows receive `NULL` ownership and are not returned to authenticated users; no arbitrary account is assigned.
