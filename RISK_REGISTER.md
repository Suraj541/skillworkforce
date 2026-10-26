# Risk register

| Risk | Impact | Mitigation/status |
|---|---|---|
| No authentication/authorization | High | Server scripts now bind to loopback; add identity, ownership checks, and CSRF protection before shared deployment |
| Unbounded request/workflow/run resources | Medium | Graph and field limits added; add rate limiting and execution quotas before shared deployment |
| Imported content execution | High | No arbitrary code node; current engine does not execute imported content |
| Browser test driver unavailable | Medium | Current local browser smoke was verified; retain service tests as the release baseline |
| Expanded SOP source files absent | Medium | Seed only the nine documented core skills; do not fabricate appendix content |
