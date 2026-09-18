# CSV Insights Progress Checklist

## Current status

- [x] Phase 1: Monorepo foundation complete
- [x] Phase 2: S3-backed CSV storage complete
- [x] Phase 3: Lambda async processing complete
- [x] Phase 4: DynamoDB metadata persistence complete
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
- [x] Keep project docs aligned with the live AWS execution flow

### Phase 4 — DynamoDB metadata persistence

- [x] Analysis records can be written to DynamoDB in app code
- [x] Dataset list/detail hydration reads from DynamoDB records
- [x] Define final DynamoDB table schema
- [x] Add status lifecycle: uploaded / processing / processed / failed
- [x] Persist analysis metadata in the DynamoDB shape used by Lambda
- [x] Store only analysis metadata, not full CSV content
- [x] Validate schema against real query patterns

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

1. Keep the repo aligned with the live AWS Lambda + S3 + DynamoDB flow.
2. Remove stale local-memory assumptions from the project docs and app notes.
3. Add API Gateway exposure for the backend service.
4. Move to observability, hardening, and production deployment readiness.

## Notes

- The AWS-side Lambda pipeline is already connected to S3 and DynamoDB.
- The remaining work is mainly repo-level alignment, API Gateway exposure, and production hardening.
- The next meaningful milestone is repo consistency plus deployment readiness, not more Lambda wiring in this project.
