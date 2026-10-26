# SkillForge AI

SkillForge AI is a local-first visual skill workflow studio. The current MVP slice provides a persisted n8n-inspired workflow canvas backed by SQLite, typed node validation, real workflow runs, per-node logs, a security gate, and ZIP artifact generation.

## Run locally

```bash
npm install
npm run db:init
npm run db:seed
npm run dev
```

Open `http://localhost:3000/workflows`.

## Release checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The database is created at `data/skillforge.db` by default. Override it with `SKILLFORGE_DB_PATH`. Development and production start scripts bind to `127.0.0.1` because authentication and authorization are not implemented. Do not expose this MVP to a shared network or use destructive reset commands against production data.

## Evidence boundary

The workflow vertical slice is implemented and browser-verified. Skill import/library UX, discovery, projects, provider adapters, authentication, cancellation, and expanded SOP appendix templates are explicitly deferred; see `IMPLEMENTATION_STATUS.md`.