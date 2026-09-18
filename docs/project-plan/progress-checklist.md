# CSV Insights Progress Checklist

## Current status

- [ ] Phase 1: Monorepo foundation complete
- [ ] Phase 2: S3-backed CSV storage complete
- [ ] Phase 3: Lambda async processing started
- [ ] Phase 4: DynamoDB metadata persistence partially implemented
- [ ] Phase 5: API Gateway exposure not started
- [ ] Phase 6: Observability and production hardening not started

## Phase-by-phase checklist

### Phase 1 — Foundation

- [x] Monorepo with pnpm + Turborepo
- [x] Next.js web app
- [x] Node API app
- [x] Shared types package
- [x] Analyzer package
- [x] Basic docs structure

### Phase 2 — S3-backed CSV storage

- [x] Upload CSV through API
- [x] Validate CSV input
- [x] Store original file in private S3 bucket
- [x] Read CSV back from S3
- [x] Display dataset metadata and rows
- [x] Use S3 object key for file retrieval
- [ ] Add stronger error handling and retry strategy
- [ ] Document AWS S3 security and lifecycle decisions

### Phase 3 — Lambda async processing

- [x] Trigger Lambda on S3 object creation (AWS-side flow is active)
- [x] Lambda reads uploaded CSV from S3 (AWS-side flow is active)
- [x] Lambda runs analyzer logic (AWS-side flow is active)
- [x] Lambda handles failures and retries (AWS-side flow is active)
- [x] Lambda logs structured events to CloudWatch (AWS-side flow is active)
- [x] Lambda execution role uses least-privilege IAM (AWS-side flow is active)
- [x] Lambda timeout and memory tuned (AWS-side flow is active)
- [ ] Add repo-level Lambda implementation and deployment notes for traceability
- [ ] Keep project docs aligned with the live AWS execution flow

### Phase 4 — DynamoDB metadata persistence

- [x] Analysis records can be written to DynamoDB in app code
- [x] Dataset list/detail hydration reads from DynamoDB records
- [x] Define final DynamoDB table schema
- [x] Add status lifecycle: uploaded / processing / processed / failed
- [ ] Persist dataset metadata on upload, not only after analysis
- [ ] Store only analysis metadata, not full CSV content
- [ ] Validate schema against real query patterns

### Phase 5 — API Gateway

- [ ] Expose API via API Gateway
- [ ] Secure route access with proper auth/policies
- [ ] Replace direct backend exposure in local-only setup
- [ ] Add API Gateway integration notes and architecture diagram

### Phase 6 — Production hardening

- [ ] CloudWatch logs and metrics
- [ ] IAM least privilege review
- [ ] Error alerts and monitoring
- [ ] Deployment automation
- [ ] Cost review and scaling considerations

## Immediate next actions

1. Document the live AWS Lambda + S3 + DynamoDB flow in the repo.
2. Finalize the DynamoDB schema and status model in code and docs.
3. Add upload-time metadata persistence if the repo still needs to mirror AWS behavior.
4. Remove reliance on local in-memory dataset storage where the AWS flow is meant to be the source of truth.

## Notes

- The AWS-side Lambda pipeline is already connected to S3 and DynamoDB.
- The remaining work is mainly repo-level alignment, documentation, and any local code cleanup needed to match the live architecture.
- The next meaningful milestone is repo consistency, not more Lambda wiring in this project.
