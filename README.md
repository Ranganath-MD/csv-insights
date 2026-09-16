# CSV Insight

CSV Insight is a small developer-facing data analysis application built as an AWS learning project.

This repository currently contains only the Phase 1 foundation:

- Monorepo setup with `pnpm` + `Turborepo`
- `apps/web` (Next.js + React + TypeScript + Tailwind + shadcn/ui base + Recharts)
- `apps/api` (Node.js + TypeScript + Hono)
- `packages/types` (shared TypeScript types)
- `packages/analyzer` (placeholder analyzer interface)
- `docs` folders for architecture, AWS notes, and interview prep

No AWS services are implemented yet.

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

Phase 1 only: `Next.js -> Node API -> local project structure`.

## API Endpoints (Phase 1)

Base URL: `http://localhost:4000`

- `GET /` API index
- `GET /health` health check
- `POST /datasets` upload a CSV file via `multipart/form-data` with field name `file`
- `GET /datasets` list uploaded datasets
- `GET /datasets/:id` get dataset metadata by id
- `GET /analysis/placeholder` placeholder analysis response

Phase 1 storage behavior:

- Uploaded files are stored locally under `data/datasets`
- Dataset metadata is kept in memory (resets when API restarts)
- No AWS integration yet
