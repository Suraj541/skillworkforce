# Architecture

The app uses Next.js App Router with a client workflow editor and server route handlers. `src/lib/types.ts` contains shared graph/run types; `src/lib/node-catalog.ts` is the registry; `src/lib/engine.ts` validates and executes supported nodes; `src/lib/db.ts` owns the local `node:sqlite` database and schema initialization.

The initial vertical slice intentionally keeps the graph JSON in a normalized workflow row and stores runs separately. This is reversible: node/edge tables can be added later without changing route contracts. External content is not executed; the current engine only transforms configured text and writes a fixed-entry ZIP artifact.

The local MVP has no identity or authorization layer. Development and production scripts bind to loopback to reduce accidental exposure; shared deployment requires authentication, ownership checks, and CSRF protection before it is safe.
