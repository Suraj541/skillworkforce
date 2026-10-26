# API inventory

| Method | Path | Purpose | Persistent effect | Test |
|---|---|---|---|---|
| GET | `/api/workflows` | List workflows | Read workflows | HTTP smoke |
| POST | `/api/workflows` | Create default graph | Insert workflow | HTTP smoke; `src/lib/engine.test.ts` |
| GET | `/api/workflows/:id` | Read workflow | Read workflow | HTTP smoke |
| PATCH | `/api/workflows/:id` | Update graph/name | Update workflow/version | HTTP smoke; `src/lib/engine.test.ts` |
| DELETE | `/api/workflows/:id` | Delete owned workflow | Delete workflow row | `src/lib/engine.test.ts` |
| POST | `/api/workflows/:id/validate` | Validate graph | None | HTTP smoke |
| GET | `/api/workflows/:id/runs` | List workflow runs | Read runs | HTTP smoke |
| POST | `/api/workflows/:id/runs` | Execute supported graph | Insert run/logs and ZIP | HTTP smoke; `src/lib/engine.test.ts` |
| GET | `/api/runs/:runId` | Inspect a run | Read run | HTTP smoke |
| POST | `/api/auth/login` | Start an opaque session | Insert session | `src/lib/engine.test.ts` |
| POST | `/api/auth/logout` | Invalidate current session | Delete session | `src/lib/engine.test.ts` |
| GET | `/api/auth/me` | Inspect current user | Read session/user | `src/lib/engine.test.ts` |

All workflow/run routes require a valid session cookie. State-changing cookie-authenticated requests additionally require an exact configured `Origin` and a matching `skillforge_csrf` cookie plus `x-csrf-token` header. Responses use `{ data }` on success and `{ error: { code, message, details? } }` for route errors.

The local bootstrap command creates the first user; there is no public registration route:

```bash
SKILLFORGE_BOOTSTRAP_EMAIL=owner@example.test \
SKILLFORGE_BOOTSTRAP_PASSWORD='use-a-unique-12-character-secret' \
npm run auth:bootstrap
```

Legacy ownership recovery is intentionally not exposed as an API. The operator-only `npm run ownership:recover` CLI is documented in `README.md` and `SECURITY-REVIEW.md`.
