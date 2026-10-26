# Decisions

1. Use Next.js App Router, React, TypeScript, and Tailwind-compatible CSS because the repository was empty.
2. Preserve `node:sqlite` rather than adding an ORM; the MVP needs a small local persistence surface and the runtime supports the built-in API.
3. Use a typed node registry and a custom canvas for the first slice. `@xyflow/react` is included for a later richer editor migration, but the current graph interaction is dependency-light and inspectable.
4. Do not claim ZIP export until bytes are actually generated and re-parsed.
