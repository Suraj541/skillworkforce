# API INVENTORY

| Method | Path | Purpose | Status |
|---|---|---|---|
| GET | /api/workflows | List workflows | implemented |
| POST | /api/workflows | Create workflow | implemented |
| GET | /api/workflows/:id | Fetch workflow detail | implemented |
| PATCH | /api/workflows/:id | Update workflow | implemented |
| DELETE | /api/workflows/:id | Delete workflow | implemented |
| POST | /api/workflows/:id/validate | Validate workflow graph/config | implemented |
| GET | /api/workflows/:id/runs | List runs for workflow | implemented |
| POST | /api/workflows/:id/runs | Execute workflow run | implemented |
| GET | /api/runs/:runId | Fetch run detail + node runs | implemented |
| POST | /api/runs/:runId/cancel | Cancel running run | implemented (state-gated) |
| GET | /api/skills | List seeded skill metadata | implemented |
| GET | /api/skills/:id | Fetch seeded skill metadata | implemented |
| GET | /api/node-catalog | List runnable node definitions | implemented |

## Error envelope
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The workflow configuration is invalid.",
    "details": []
  }
}
```

## UI traceability map (implemented controls)

| Page | Control | Action | Endpoint/Operation | Service | Persistence effect | Success feedback | Failure feedback |
|---|---|---|---|---|---|---|---|
| `/workflows` | Create workflow button | create workflow | `POST /api/workflows` (UI server action currently calls service directly) | `createWorkflow` | insert `workflows` row | new workflow opens | server error response |
| `/workflows/[id]` | Save | persist graph changes | `PATCH /api/workflows/:id` | `updateWorkflow` | update `workflows.graph_json` + version | status badge `saved` | status `save-failed` |
| `/workflows/[id]` | Validate | validate graph/config | `POST /api/workflows/:id/validate` | `validateWorkflow` | none | status `valid` | issues listed / `invalid` |
| `/workflows/[id]` | Run | create run | `POST /api/workflows/:id/runs` | `createRun` | insert run + node run records | status `run:success|warning|failed` | status `run-failed` |
| `/runs` | Inspect link | open run detail | `GET /api/runs/:runId` (page currently calls service directly) | `getRun` | none | run detail rendered | not-found page |
| `/skills` | Open skill | open skill detail | `GET /api/skills/:id` (page currently calls service directly) | `getSkill` | none | skill detail rendered | not-found page |
