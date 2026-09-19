# CSV Insights Architecture

This document describes the final architecture of the CSV Insights application.

CSV Insights is intentionally designed as a small AWS-focused application with one primary workflow:

> User uploads a CSV → the API stores the original file in Amazon S3 → S3 triggers asynchronous analysis → the Analysis Lambda processes the CSV → analysis results are stored in DynamoDB → the API retrieves persisted analysis for the frontend.

<img width="1168" height="784" alt="6w4tV" src="https://github.com/user-attachments/assets/22a95804-6594-43a9-949f-3f90f5f87acd" />


---

## 1. Architecture Overview

```text
                           Browser / User
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   Next.js Web App      │
                    │        Vercel          │
                    └───────────┬────────────┘
                                │ HTTPS
                                ▼
                    ┌────────────────────────┐
                    │   Amazon API Gateway   │
                    │       HTTP API         │
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │   AWS Lambda           │
                    │   Hono API             │
                    │   csv-insights-api     │
                    └───────────┬────────────┘
                                │
                         Upload / Read
                                │
                                ▼
                    ┌────────────────────────┐
                    │      Amazon S3         │
                    │  Private CSV objects   │
                    └───────────┬────────────┘
                                │
                         ObjectCreated
                                │
                                ▼
                    ┌────────────────────────┐
                    │   AWS Lambda           │
                    │   CSV Analyzer         │
                    │   csv-insight-analyzer │
                    └───────────┬────────────┘
                                │
                         Analysis result
                                │
                                ▼
                    ┌────────────────────────┐
                    │    Amazon DynamoDB     │
                    │ Analysis + metadata    │
                    └───────────▲────────────┘
                                │
                         Analysis reads
                                │
                    ┌───────────┴────────────┐
                    │   Hono API Lambda      │
                    └────────────────────────┘
```

The important distinction is that the API request and the analysis process are not one synchronous chain.

### Synchronous request flow

```text
Browser
   ↓
Next.js / Vercel
   ↓
API Gateway
   ↓
Hono API Lambda
   ↓
S3
```

### Asynchronous analysis flow

```text
S3
   ↓
ObjectCreated event
   ↓
Analysis Lambda
   ↓
DynamoDB
```

### Analysis read flow

```text
Browser
   ↓
Next.js
   ↓
API Gateway
   ↓
Hono API Lambda
   ↓
DynamoDB
   ↓
Persisted analysis
```

---

# 2. Runtime Components

## 2.1 Frontend

Location:

```text
apps/web
```

The frontend is a Next.js application deployed to Vercel.

Responsibilities:

* CSV upload
* dataset listing
* dataset details
* CSV table rendering
* search
* filtering
* sorting
* pagination
* analysis display
* charts
* theme switching
* error handling

The frontend communicates with the backend through:

```text
NEXT_PUBLIC_API_BASE_URL
```

The browser does not directly access:

* Amazon S3
* Amazon DynamoDB
* AWS credentials

---

## 2.2 API

Location:

```text
apps/api
```

Framework:

```text
Hono
```

The API has two entry points.

### Local development

```text
apps/api/src/index.ts
```

This starts the Hono application using the Node.js server adapter.

### AWS Lambda

```text
apps/api/src/lambda.ts
```

This adapts the Hono application to AWS Lambda.

Production request path:

```text
Next.js
   ↓
API Gateway HTTP API
   ↓
Hono API Lambda
```

The API is responsible for:

* receiving HTTP requests
* validating CSV uploads
* generating dataset IDs
* generating S3 object keys
* uploading CSV files to S3
* retrieving CSV data from S3
* returning dataset rows
* retrieving persisted analysis
* returning dataset information
* handling API errors

---

# 3. Amazon S3

Amazon S3 is the durable storage layer for the original uploaded CSV files.

The uploaded objects are private.

Conceptually, objects follow a dataset-specific structure such as:

```text
uploads/{datasetId}/{filename}
```

S3 is responsible for:

* storing the original CSV
* preserving uploaded files across API restarts
* providing CSV data to the API
* providing CSV data to the Analysis Lambda
* emitting the ObjectCreated event that starts asynchronous analysis

The browser does not access the bucket directly.

---

# 4. Analysis Lambda

Lambda function:

```text
csv-insight-analyzer
```

The Analysis Lambda is responsible for asynchronous CSV processing.

Its flow is:

```text
S3 ObjectCreated
       ↓
Analysis Lambda
       ↓
Read CSV from S3
       ↓
Run CSV analysis
       ↓
Write analysis result
       ↓
DynamoDB
```

The Lambda does not handle frontend HTTP requests.

Its purpose is to process uploaded CSV files independently from the API request.

This means that uploading a file and analyzing a file are separate operations.

---

# 5. DynamoDB

DynamoDB stores persisted analysis information.

Current table:

```text
csv-insight-analysis
```

The Analysis Lambda writes analysis results to DynamoDB.

The API reads persisted analysis from DynamoDB when the frontend requests analysis information.

Therefore:

```text
Analysis Lambda
       ↓
    DynamoDB
       ↑
       │
Hono API Lambda
       ↑
       │
    Frontend
```

DynamoDB provides persistence for analysis results beyond the lifetime of a Lambda invocation.

---

# 6. Shared Packages

## `packages/types`

Contains shared TypeScript contracts used by the application.

The purpose is to keep data structures consistent between the frontend and backend.

---

## `packages/analyzer`

Contains the CSV analysis logic used by the analysis pipeline.

The Analysis Lambda uses this package to perform analysis on uploaded CSV files.

The analyzer is kept separate from the HTTP/API layer so that CSV analysis remains an independent piece of application logic.

---

# 7. Upload Flow

When a user uploads a CSV, the following sequence occurs:

```text
1. User selects a CSV
          ↓
2. Next.js sends multipart request
          ↓
3. API Gateway receives request
          ↓
4. Hono API Lambda receives request
          ↓
5. API validates the CSV
          ↓
6. API generates dataset ID
          ↓
7. API generates S3 object key
          ↓
8. API uploads original CSV to S3
          ↓
9. API returns the upload response
          ↓
10. S3 emits ObjectCreated event
          ↓
11. Analysis Lambda is invoked
          ↓
12. Lambda reads CSV from S3
          ↓
13. Lambda performs analysis
          ↓
14. Lambda writes result to DynamoDB
```

The important design principle is:

**The upload request does not need to perform the entire analysis synchronously.**

Analysis happens asynchronously after the object is created in S3.

---

# 8. Dataset Read Flow

## Dataset list

```text
Next.js
   ↓
API Gateway
   ↓
Hono API Lambda
   ↓
Dataset metadata
   ↓
Next.js
```

Dataset metadata currently includes API-managed state that is not represented as a separate durable DynamoDB dataset table.

This is an intentional simplification of the current application.

---

## Dataset rows

When the frontend requests dataset rows:

```text
Next.js
   ↓
API Gateway
   ↓
Hono API Lambda
   ↓
Amazon S3
   ↓
Original CSV
   ↓
API processes rows
   ↓
Next.js
```

The API reads the original CSV from S3 and performs the application's row retrieval, search, filtering, sorting, and pagination behavior.

---

## Dataset analysis

When the frontend requests analysis:

```text
Next.js
   ↓
API Gateway
   ↓
Hono API Lambda
   ↓
DynamoDB
   ↓
Persisted analysis
   ↓
Next.js
```

The API uses the persisted analysis result rather than requiring the frontend to communicate directly with DynamoDB.

---

# 9. Local Development

Local development runs the Next.js frontend and Hono API locally while the API can still communicate with AWS services.

```text
┌────────────────────┐
│ Next.js            │
│ localhost:3000     │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Hono API           │
│ localhost:4000     │
└─────────┬──────────┘
          │
          ▼
      AWS Services
       ├── S3
       └── DynamoDB
```

Frontend:

```bash
pnpm --filter @csv-insight/web dev
```

API:

```bash
pnpm --filter @csv-insight/api dev
```

The local API starts from:

```text
apps/api/src/index.ts
```

The local application uses the standard AWS credential provider chain.

AWS credentials must not be committed to the repository.

---

# 10. Production Deployment

## 10.1 Web application

```text
apps/web
     ↓
Vercel
```

The Next.js application is deployed to Vercel.

The frontend uses:

```text
NEXT_PUBLIC_API_BASE_URL
```

to communicate with API Gateway.

---

## 10.2 API

```text
apps/api
     ↓
Lambda build
     ↓
AWS Lambda
     ↓
API Gateway HTTP API
```

The Lambda handler is:

```text
apps/api/src/lambda.ts
```

---

## 10.3 Analysis Lambda

The Analysis Lambda is deployed separately from the API Lambda.

```text
apps/api
     ↓
csv-insight-analyzer
     ↓
S3 ObjectCreated trigger
```

The analysis Lambda has its own AWS runtime and execution permissions.

---

## 10.4 AWS data stores

The AWS backend uses:

```text
Amazon S3
Amazon DynamoDB
```

These services remain outside the Vercel deployment.

---

# 11. Security Model

The browser communicates only with the API.

```text
Browser
   │
   │ HTTPS
   ▼
API Gateway
   │
   ▼
Hono API Lambda
   │
   ├── S3
   │
   └── DynamoDB
```

The application follows these principles:

* S3 objects are private.
* The browser does not receive AWS credentials.
* The browser does not access DynamoDB directly.
* AWS credentials are not committed to Git.
* Local AWS access uses the standard credential provider chain.
* `.env.example` contains placeholders only.
* Production frontend access is controlled through API configuration and CORS.
* AWS access is performed by backend/Lambda execution roles rather than by the browser.

---

# 12. Data Ownership

The final architecture separates responsibilities between application layers.

| Component           | Responsibility                        |
| ------------------- | ------------------------------------- |
| Next.js / Vercel    | UI and user interaction               |
| API Gateway         | HTTP entry point                      |
| Hono API Lambda     | API processing and S3/DynamoDB access |
| S3                  | Original CSV storage                  |
| Analysis Lambda     | Asynchronous CSV analysis             |
| DynamoDB            | Persisted analysis results            |
| `packages/types`    | Shared TypeScript contracts           |
| `packages/analyzer` | CSV analysis logic                    |

The most important data ownership rules are:

```text
Original CSV
     ↓
    S3
```

and:

```text
Analysis result
     ↓
  DynamoDB
```

The API acts as the backend interface between the frontend and these AWS services.

---

# 13. AWS Service Responsibilities

## Amazon API Gateway

Provides the public HTTP entry point for the backend API.

```text
Frontend → API Gateway → Lambda
```

---

## AWS Lambda

Two Lambda responsibilities exist.

### API Lambda

```text
csv-insights-api
```

Runs the Hono HTTP API.

### Analysis Lambda

```text
csv-insight-analyzer
```

Processes CSV files asynchronously after S3 object creation.

---

## Amazon S3

Provides durable object storage for uploaded CSV files.

---

## Amazon DynamoDB

Provides durable persistence for CSV analysis results.

---

# 14. Why the Analysis Is Asynchronous

The application intentionally separates upload from analysis.

Instead of:

```text
Upload
  ↓
API analyzes entire CSV
  ↓
Response
```

the application uses:

```text
Upload
  ↓
S3
  ↓
ObjectCreated event
  ↓
Analysis Lambda
  ↓
DynamoDB
```

This separation demonstrates an important AWS serverless pattern:

**an event in one AWS service can trigger processing in another service.**

It also prevents the upload API from being responsible for the entire analysis lifecycle.

---

# 15. Final Architecture Principles

The final application follows these principles:

1. Next.js is the presentation layer.
2. Vercel hosts the web application.
3. API Gateway is the HTTP entry point to the backend.
4. Hono runs inside the API Lambda.
5. S3 stores original CSV files.
6. S3 ObjectCreated events trigger asynchronous processing.
7. The Analysis Lambda performs CSV analysis.
8. DynamoDB stores persisted analysis results.
9. The API retrieves persisted analysis for frontend requests.
10. The browser never accesses S3 or DynamoDB directly.
11. AWS credentials are never committed to the repository.
12. The architecture intentionally uses a small number of AWS services.

---

# 16. Final Architecture at a Glance

```text
                         ┌──────────────────┐
                         │   Browser/User   │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Next.js / Vercel │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ API Gateway      │
                         │ HTTP API         │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Hono API Lambda  │
                         │ csv-insights-api │
                         └───────┬───┬──────┘
                                 │   │
                    upload/read  │   │ analysis read
                                 │   │
                                 ▼   ▼
                         ┌──────────────────┐
                         │     Amazon S3    │
                         │   Private CSVs   │
                         └────────┬─────────┘
                                  │
                           ObjectCreated
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Analysis Lambda  │
                         │csv-insight-      │
                         │analyzer          │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Amazon DynamoDB  │
                         │ Analysis Results │
                         └──────────────────┘
```

The key architectural relationship is:

```text
                    SYNCHRONOUS
Browser → Next.js → API Gateway → API Lambda → S3

                    ASYNCHRONOUS
S3 → ObjectCreated → Analysis Lambda → DynamoDB

                    READ
Next.js → API Gateway → API Lambda → DynamoDB
                                     
                    ROW DATA
Next.js → API Gateway → API Lambda → S3
```

This represents the final intended runtime architecture of CSV Insights.
