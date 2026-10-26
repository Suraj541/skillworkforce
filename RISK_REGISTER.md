# RISK REGISTER

| Risk | Impact | Status | Mitigation |
|---|---|---|---|
| No endpoint-level automated tests yet | Regressions can escape | open | Add route integration tests for all registered endpoints |
| Discovery/project/security sections are shell-only | Feature expectations mismatch | open | Track as deferred MVP backlog with explicit status |
| Browser e2e may be blocked in restricted environment | UI behavior not fully verified | open | Document blocker and run Playwright where permitted |
| Local sqlite file persistence in app runtime | Concurrency constraints | open | Keep single-process MVP and evaluate robust DB in later phase |
