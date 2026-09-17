# Architecture Notes

This folder tracks architecture decisions and phase-wise evolution.

Current phase: Phase 2 (S3-backed CSV storage).

Current API flow:

1. Client uploads CSV to API (`POST /datasets`)
2. API validates the CSV and uploads the original object to a private S3 bucket
3. API downloads the object from S3 and passes its text to the independent analyzer
4. API keeps dataset metadata and the S3 object key in an in-memory map
5. Client fetches dataset list/detail, rows, and analysis from API

Notes:

- S3 is the durable source for original CSV objects; metadata persistence remains in-memory.
- AWS SDK calls are isolated in `apps/api/src/services/s3.service.ts`.
- The analyzer has no AWS dependency, so it can be reused by a later Lambda implementation.
