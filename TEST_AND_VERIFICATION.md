# Test and verification

## Commands

```bash
npm install
npm run db:init
npm run db:seed
npm run typecheck
npm test
npm run build
npm run dev
```

## Evidence policy

Unit/integration checks establish service and persistence behavior; they do not prove the rendered UI. Browser status must be recorded separately. Endpoint exercise coverage is the count of registered route/method pairs called by tests, not line or branch coverage.

## Current status

Baseline checks were unavailable before the empty repository received a package manifest. Current checks: lint passed, typecheck passed, five behavioral regression tests passed, production build passed, database init/seed passed, HTTP route exercise passed (8/8) in the prior baseline, successful ZIP integrity check passed, security-gate blocking passed, and browser workflow smoke passed. New regression coverage verifies malformed JSON, duplicate nodes, broken edges, cycles, unsupported nodes, topological execution, ZIP contents, and seed idempotency. `npm audit --omit=dev --audit-level=high` remains blocked by one high and one moderate transitive vulnerability in the current Next/PostCSS dependency tree; a forced fix would upgrade Next across a breaking-version boundary.
