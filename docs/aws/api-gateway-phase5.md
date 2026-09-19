# API Gateway Phase 5 Runbook

This runbook prepares CSV Insight API for API Gateway HTTP API exposure.

## Scope

- Expose existing Lambda-backed Hono API through API Gateway HTTP API.
- Keep Lambda handler as `index.handler`.
- Keep current routes unchanged.

## Prerequisites

- Lambda package built from `apps/api/src/lambda.ts`.
- Environment variables set on Lambda:
  - `AWS_REGION`
  - `S3_BUCKET_NAME`
  - `DYNAMODB_TABLE_NAME`
  - `CORS_ORIGIN` (recommended explicit origin)
- IAM execution role allows:
  - `s3:GetObject`, `s3:PutObject` on upload key scope
  - `dynamodb:PutItem`, `dynamodb:Query`, `dynamodb:Scan` on analysis table

## Local validation before AWS changes

From `apps/api`:

```bash
pnpm exec esbuild src/lambda.ts \
  --bundle \
  --platform=node \
  --target=node24 \
  --format=esm \
  --main-fields=module,main \
  --outfile=dist-lambda/index.js
node scripts/test-lambda.mjs
node scripts/test-lambda-preflight.mjs
```

Expected:

- `test-lambda.mjs` returns `200` for `GET /health`.
- `test-lambda-preflight.mjs` returns `204` and CORS headers.

## API Gateway HTTP API settings

- Integration type: Lambda proxy integration
- Payload format version: `2.0`
- Route: `$default` or explicit routes (`GET /health`, `GET /datasets`, `POST /datasets`, ...)
- CORS at API Gateway layer:
  - Allowed origin: your exact web origin (avoid `*` in production)
  - Allowed methods: `GET,POST,PUT,PATCH,DELETE,OPTIONS`
  - Allowed headers: `content-type,authorization,x-request-id`

## Post-deploy smoke checks

1. `GET /health` -> `200`
2. `GET /datasets` -> `200`
3. `POST /datasets` with CSV -> `201`
4. Browser upload from web app does not show `Failed to fetch`
5. Dataset list refreshes after upload

## Troubleshooting

- Browser `Failed to fetch` with successful server upload:
  - verify API Gateway CORS origin and headers
  - verify Lambda response includes CORS headers
  - verify web app uses correct `NEXT_PUBLIC_API_BASE_URL`
- `403`/`AccessDenied` on S3:
  - validate Lambda role and bucket policy resource ARNs
- Empty dataset list with successful upload:
  - confirm DynamoDB table and key schema
  - inspect CloudWatch logs for write/query failures
