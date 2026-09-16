# Architecture Notes

This folder tracks architecture decisions and phase-wise evolution.

Current phase: Phase 1 (local web + API foundation).

Current API flow:

1. Client uploads CSV to API (`POST /datasets`)
2. API stores file on local disk (`data/datasets`)
3. API keeps dataset metadata in in-memory map
4. Client fetches dataset list/detail from API

Notes:

- Metadata persistence is in-memory only for now.
- This is intentional for early learning and quick iteration.
- AWS services are deferred to later phases.
