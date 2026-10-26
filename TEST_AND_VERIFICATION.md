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

Baseline checks were unavailable before the empty repository received a package manifest. Current checks: lint passed, typecheck passed, ten behavioral regression tests passed, production build passed, database init/seed passed, successful ZIP integrity check passed, security-gate blocking passed, seed idempotency passed, authenticated owner/CSRF route behavior passed, legacy migration preservation passed, browser login/workflow execution passed, legacy ownership recovery preview/transaction/audit behavior passed, and both production dependency audits passed with zero vulnerabilities after the PostCSS override.

## Migration behavior

Database initialization creates `schema_migrations`, `users`, and `sessions`, then adds `workflows.owner_id` if it is missing. Existing workflows and runs are preserved. Legacy workflows receive `NULL` ownership and are not returned to authenticated users; no arbitrary account is assigned.

## Legacy ownership recovery

`npm run ownership:recover -- --list` reports only workflow IDs with `owner_id IS NULL`. A dry run validates explicit IDs and the existing destination user without changing rows. Confirmed reassignment uses `BEGIN IMMEDIATE`, rejects ownership changes or mixed owned/ownerless selections, preserves runs through the parent workflow, records an audit event, and is idempotent for the same operation key. No recovery route exists for unauthenticated or ordinary authenticated callers.

## Dependency remediation

- Before: `next@15.5.28 -> postcss@8.4.31`; production audit reported 1 high and 1 moderate vulnerability across four PostCSS advisories.
- After: `next@15.5.28 -> postcss@8.5.31` via the package-manager override in `package.json`.
- `npm audit --omit=dev --audit-level=high`: passed, 0 vulnerabilities.
- `npm audit --omit=dev`: passed, 0 vulnerabilities.
- `npm ls next postcss react react-dom`: passed; Next remains `15.5.28`, PostCSS is `8.5.31 overridden`, React/React DOM are `19.3.1`.
- `npm test`: 9 passed.
- `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`: passed.
- Authenticated HTTP smoke and browser login/workflow execution remained successful after the dependency change.
