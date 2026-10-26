# ARCHITECTURE

## Implemented
- Next.js App Router application (server + client components).
- SQLite persistence via `node:sqlite` in `src/lib/db.ts`.
- Service boundary in `src/lib/workflow-service.ts`.
- Node registry in `src/lib/node-registry.ts` for runnable workflow node definitions.
- API route handlers under `src/app/api/**` with structured error envelope.
- UI shell + workflow canvas editor using `@xyflow/react`.

## Partially implemented
- Workflow execution engine supports deterministic single-path MVP nodes.
- Skill library currently seeded from local SOP seed pack metadata only.

## Not implemented
- Multi-tenant authz/authn, provider adapters, external discovery adapters, advanced governance workflows.
