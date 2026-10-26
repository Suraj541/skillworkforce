# WORKFLOW NODE CATALOG

## Runnable nodes
1. `existing-skill` (source)
2. `compose-skill` (composition)
3. `metadata-validator` (validation)
4. `security-scan` (validation)
5. `acceptance-gate` (validation)
6. `export-zip` (output)

## Execution notes
- Validation rejects unsupported cycles.
- Export is blocked if acceptance gate requires manual approval.
- Security scanner can force deterministic failure via node config (`forceFailure`).
