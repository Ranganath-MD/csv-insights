# CSV Insight

CSV Insight is a small developer-facing data analysis application built as an AWS learning project.

This repository contains Phase 2 S3-backed CSV storage on top of the Phase 1 foundation:

- Monorepo setup with `pnpm` + `Turborepo`
- `apps/web` (Next.js + React + TypeScript + Tailwind + shadcn/ui base + Recharts)
- `apps/api` (Node.js + TypeScript + Hono)
- `packages/types` (shared TypeScript types)
- `packages/analyzer` (CSV analysis interface)
- `docs` folders for architecture, AWS notes, and interview prep

Uploaded CSV objects are stored in a private Amazon S3 bucket. The production-facing
flow is the AWS async path: S3 triggers a Lambda, the Lambda analyzes the CSV, and
metadata/analysis records are persisted in DynamoDB. The repo may still include local
fallback behavior for development, but the live architecture is the AWS-backed flow.

## Workspace Structure

```txt
apps/
  web/
  api/
packages/
  analyzer/
  types/
docs/
  architecture/
  aws/
  interview/
```

## Prerequisites

- Node.js 20+
- pnpm 9+

## Install

```bash
pnpm install
```

## Run

Copy `apps/api/.env.example` to `apps/api/.env` and set `AWS_REGION`,
`S3_BUCKET_NAME`, and `DYNAMODB_TABLE_NAME`. Authenticate locally through the
standard AWS credential provider chain (such as AWS SSO or a named AWS profile);
do not add credentials to `.env`. Set `AWS_PROFILE` when the intended identity is
not your default AWS profile.

Start all dev servers:

```bash
pnpm dev
```

Start only web app:

```bash
pnpm --filter @csv-insight/web dev
```

Start only API app:

```bash
pnpm --filter @csv-insight/api dev
```

## Validate

```bash
pnpm typecheck
pnpm build
pnpm lint
```

## Current Milestone

Phase 4: `Next.js + Node API -> Amazon S3 -> Lambda -> analysis metadata in DynamoDB`.

## API Endpoints

Base URL: `http://localhost:4000`

- `GET /` API index
- `GET /health` health check
- `POST /datasets` upload a CSV file via `multipart/form-data` with field name `file`
- `GET /datasets` list uploaded datasets
- `GET /datasets/:id` get dataset metadata by id
- `GET /datasets/:id/rows` retrieve searchable, sortable, paginated rows
- `GET /datasets/:id/analysis` retrieve dataset analysis
- `GET /analysis/placeholder` placeholder analysis response

Storage behavior:

- Original uploaded CSV files are stored in S3 under unique `uploads/{id}/...` keys
- The AWS Lambda pipeline reads the object from S3 and persists analysis metadata to DynamoDB
- The local app can still read from DynamoDB and S3 for development and validation
- Dataset metadata is not treated as the source of truth in the live AWS architecture
