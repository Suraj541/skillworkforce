# Risk register

| Risk | Impact | Mitigation/status |
|---|---|---|
| No authentication/authorization | High | Remediated with sessions, ownership checks, and CSRF protection; retain operational hardening before shared deployment |
| Unbounded request/workflow/run resources | Medium | Rate limits, execution counters, timeout/log/archive bounds, and graph limits implemented; durable worker/cancellation remains |
| In-process abuse controls | Medium | Tested bounded rate limits and quotas; use a shared gateway/limiter and durable worker for multi-instance deployment |
| SQLite loss or corruption | High | Consistent `VACUUM INTO` backup and integrity-checked restore scripts; operators must schedule protected backups and drills |
| Unsupported Next major | High | Next 15.5.28 is audit-clean but beyond the 2026-10-21 maintenance window; schedule and test a Next 16 migration before shared or internet-facing deployment |
| Imported content execution | High | No arbitrary code node; current engine does not execute imported content |
| Browser test driver unavailable | Medium | Current local browser smoke was verified; retain service tests as the release baseline |
| Expanded SOP source files absent | Medium | Seed only the nine documented core skills; do not fabricate appendix content |
