# SkillForge AI

SkillForge AI is a local-first visual skill workflow studio. The current MVP slice provides a persisted n8n-inspired workflow canvas backed by SQLite, typed node validation, real workflow runs, per-node logs, a security gate, and ZIP artifact generation.

## Run locally

```bash
npm install
npm run db:init
npm run db:seed
npm run dev
```

Create the first local account, then open `http://127.0.0.1:3000/login`:

```bash
SKILLFORGE_BOOTSTRAP_EMAIL=owner@example.test \
SKILLFORGE_BOOTSTRAP_PASSWORD='use-a-unique-12-character-secret' \
npm run auth:bootstrap
```

Open `http://127.0.0.1:3000/login`.

### Recovering legacy workflow ownership

Legacy workflows have `owner_id = NULL` and are hidden from ordinary users. Back up the SQLite file before recovery, then list candidates:

```bash
npm run ownership:recover -- --list
```

Preview a specific reassignment without changing data:

```bash
npm run ownership:recover -- --operator ops@example.test --to-user user@example.test --reason "Support ticket REC-1" --workflow <workflow-id> --dry-run
```

Apply the same explicit selection only after reviewing the preview:

```bash
npm run ownership:recover -- --operator ops@example.test --to-user user@example.test --reason "Support ticket REC-1" --workflow <workflow-id> --confirm
```

This is an operator-only CLI, not a user-facing API. It requires an existing destination user, preserves related runs and logs, uses a transaction, and records an audit event without passwords, sessions, or workflow content. Records whose historical owner cannot be established remain unassigned until an explicit operator decision.

## Release checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The database is created at `data/skillforge.db` by default. Override it with `SKILLFORGE_DB_PATH`. Development and production start scripts bind to `127.0.0.1`. Set `SKILLFORGE_APP_ORIGIN` when using a different trusted origin. Do not expose this MVP to a shared network or use destructive reset commands against production data.

The dependency tree pins the transitive PostCSS remediation through an npm override to `8.5.31` while retaining Next `15.5.28`. Run `npm audit --omit=dev` to verify the production audit.

## Evidence boundary

The workflow vertical slice, authentication, ownership authorization, CSRF protection, and legacy ownership recovery CLI are implemented and browser-verified where applicable. Skill import/library UX, discovery, projects, provider adapters, cancellation, and expanded SOP appendix templates are explicitly deferred; see `IMPLEMENTATION_STATUS.md`.