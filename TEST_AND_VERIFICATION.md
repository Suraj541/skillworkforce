# TEST AND VERIFICATION

## Commands
- `npm run lint`
- `npm run build`

## Manual checks performed
- Verified workflow pages and API handlers compile.
- Verified SQLite DB initialization and idempotent seeding run on app start.

## Known verification gaps
- Automated endpoint tests: not implemented.
- Browser automation/e2e: blocked unless browser driver installation/execution is available in environment.
