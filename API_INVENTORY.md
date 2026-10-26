# API inventory

| Method | Path | Purpose | Persistent effect | Test |
|---|---|---|---|---|
| GET | `/api/workflows` | List workflows | Read workflows | HTTP smoke |
| POST | `/api/workflows` | Create default graph | Insert workflow | HTTP smoke; `src/lib/engine.test.ts` |
| GET | `/api/workflows/:id` | Read workflow | Read workflow | HTTP smoke |
| PATCH | `/api/workflows/:id` | Update graph/name | Update workflow/version | HTTP smoke; `src/lib/engine.test.ts` |
| POST | `/api/workflows/:id/validate` | Validate graph | None | HTTP smoke |
| GET | `/api/workflows/:id/runs` | List workflow runs | Read runs | HTTP smoke |
| POST | `/api/workflows/:id/runs` | Execute supported graph | Insert run/logs and ZIP | HTTP smoke; `src/lib/engine.test.ts` |
| GET | `/api/runs/:runId` | Inspect a run | Read run | HTTP smoke |

All responses use `{ data }` on success and `{ error: { code, message } }` for route errors. Request validation is currently narrow and limited to the workflow fields used by the MVP editor.
