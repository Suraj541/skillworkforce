# Engineering standards

- Do not add fake functionality or fabricate status.
- Validate external input and use explicit error envelopes.
- Never commit secrets or expose them to client bundles, logs, or exports.
- Preserve provenance and source data; create new versions instead of mutating imports.
- Test meaningful changes and do not swallow errors.
- Keep the MVP focused on accepted user value; defer speculative polish.
- Pause before destructive migrations, credential use, or security-boundary changes.
- Never claim success without evidence from the relevant layer.
