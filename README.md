# CSV Insights

CSV Insights is an AWS-focused CSV analysis app.

Workflow:

1. Upload a CSV from the web app.
2. API stores the file in Amazon S3.
3. S3 triggers asynchronous analysis.
4. Analysis results are written to DynamoDB.
5. Web app fetches dataset rows and analysis through the API.

The full system design is documented in [ARCHITECTURE.md](ARCHITECTURE.md).

## Repository Structure

- `apps/web`: Next.js frontend (Vercel)
- `apps/api`: Hono API (Node + AWS Lambda target)
- `packages/analyzer`: CSV analysis logic
- `packages/types`: Shared TypeScript types

## Prerequisites

- Node.js 20+
- pnpm (repo uses workspaces)

## Install

```bash
pnpm install
```

## Environment Variables

### Web (`apps/web/.env.local`)

Required:

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://your-api-gateway-url.amazonaws.com
```

Template file: [apps/web/.env.example](apps/web/.env.example)

### API (`apps/api`)

Required runtime variables:

- `AWS_REGION`
- `S3_BUCKET_NAME`
- `DYNAMODB_TABLE_NAME`

Optional:

- `PORT` (default: `4000`)
- `NODE_ENV` (`development`, `test`, `production`)
- `AWS_PROFILE`
- `CORS_ORIGIN` (default: `*`)

Source of truth: [apps/api/src/config/env.ts](apps/api/src/config/env.ts)

## Local Development

Run all workspace dev tasks:

```bash
pnpm dev
```

Run only web:

```bash
pnpm --filter @csv-insight/web dev
```

Run only API:

```bash
pnpm --filter @csv-insight/api dev
```

## Build, Typecheck, Test

Build all:

```bash
pnpm build
```

Typecheck all:

```bash
pnpm typecheck
```

Run API tests:

```bash
pnpm --filter @csv-insight/api test
```

## Deployment Notes (Vercel)

The web app is deployed from a monorepo. Configure the Vercel project with:

- Framework: `Next.js`
- Root Directory: `apps/web`

Then run deployments from the repository root:

```bash
vercel
```

or for production:

```bash
vercel --prod
```

If you run `vercel` from `apps/web` while Root Directory is set to `apps/web`, Vercel will fail because it resolves that path relative to the current working directory.