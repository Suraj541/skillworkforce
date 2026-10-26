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

## Release checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The database is created at `data/skillforge.db` by default. Override it with `SKILLFORGE_DB_PATH`. Development and production start scripts bind to `127.0.0.1`. Set `SKILLFORGE_APP_ORIGIN` when using a different trusted origin. Do not expose this MVP to a shared network or use destructive reset commands against production data.

## Evidence boundary

The workflow vertical slice is implemented and browser-verified. Skill import/library UX, discovery, projects, provider adapters, authentication, cancellation, and expanded SOP appendix templates are explicitly deferred; see `IMPLEMENTATION_STATUS.md`.