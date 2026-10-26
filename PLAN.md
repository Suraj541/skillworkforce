# Plan

## Phase 0 — Baseline audit
Implemented: the repository was an empty shell. Baseline lint, typecheck, tests, and build were unavailable before dependency installation because no package manifest existed.

## Phase 1 — Persisted workflow vertical slice
Implemented: a Next.js App Router shell, SQLite persistence, typed workflow graph, custom n8n-inspired canvas, node inspector, validation, run history, and gated ZIP export.

## Phase 2 — Reliable workflow
Implemented: `Existing Skill -> Compose Skill -> Validation -> Security Scan -> Export` runs through `src/lib/engine.ts`, persists logs/status, and blocks when the security node is configured to block.

## Deferred
Library UI, discovery adapters, projects, imports/ZIP handling, immutable skill versions, browser E2E coverage beyond the smoke journey, auth, cancellation, and provider-backed AI composition.
