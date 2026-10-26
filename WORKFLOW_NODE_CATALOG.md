# Workflow node catalog

Only these nodes are exposed as runnable in the current registry:

| Type | Category | Executor |
|---|---|---|
| `skill.source` | Source | Reads configured skill identifier |
| `skill.compose` | Composition | Produces deterministic composed-output log |
| `quality.validate` | Governance | Runs graph/metadata validation |
| `security.scan` | Governance | Applies configured blocking gate |
| `output.export` | Output | Records artifact intent (ZIP bytes deferred) |

Nodes not listed are not runnable and are not exposed by the palette.
