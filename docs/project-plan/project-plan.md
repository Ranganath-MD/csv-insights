Absolutely. Here is a **self-contained project brief** you can paste into Gemini, Perplexity, Claude, or another AI and continue from the same point.

---

# CSV Insight — AWS Learning Project

## 1. My goal

I am a **frontend developer with ~7 years of experience**.

I am preparing for **Cloud and DevOps interviews**.

I am a beginner in Cloud/DevOps, so I need to understand AWS and DevOps concepts from the ground up, but my target is to eventually explain and design things at the level expected from an experienced cloud/DevOps engineer.

I don't want to learn AWS only through theory.

I want to learn AWS by **building one practical application and progressively introducing AWS services into it**.

The application is called:

# CSV Insight

A small developer/data-focused application where a user uploads a CSV file and the application:

* stores the dataset
* analyzes it
* displays the actual dataset
* provides statistics
* detects missing/duplicate data
* analyzes columns
* generates useful charts

The application should remain **small and focused**.

The AWS architecture should become progressively more sophisticated as I learn AWS.

---

# 2. Core product

The user uploads a CSV.

Example:

```text
customer_id,amount,category,date,region
C001,4200,Electronics,2026-01-02,South
C002,1800,Clothing,2026-01-03,North
C003,9200,Electronics,2026-01-03,West
```

The application should show:

### Dataset table

Actual CSV data in an interactive table.

Features:

* Search
* Column filtering
* Sorting
* Pagination
* Rows per page
* Column visibility if useful

Example:

```text
Customer ID | Amount | Category    | Date       | Region
------------|--------|-------------|------------|--------
C001        | 4200   | Electronics | 2026-01-02 | South
C002        | 1800   | Clothing    | 2026-01-03 | North
C003        | 9200   | Electronics | 2026-01-03 | West
```

---

# 3. Dataset overview

Show:

```text
Rows
Columns
File Size
Missing Values
Duplicate Rows
```

Example:

```text
Rows:             12,450
Columns:          8
File Size:        2.4 MB
Missing Values:   127
Duplicate Rows:   14
```

---

# 4. Column analysis

For every column detect its type.

Possible types:

* String
* Number
* Boolean
* Date

For numeric columns:

```text
Minimum
Maximum
Average
Median
Standard deviation
```

For categorical columns:

```text
Unique values
Frequency
Most common values
```

For dates:

```text
Minimum date
Maximum date
Distribution over time
```

---

# 5. Charts

Automatically generate appropriate visualizations.

Examples:

```text
Number
→ Distribution / histogram

Category
→ Bar chart

Date + Number
→ Line chart

Two numeric columns
→ Scatter plot
```

Don't use complicated ML.

The goal is simple dataset exploration.

---

# 6. Technology stack

## Monorepo

* pnpm
* Turborepo

## Frontend

* Next.js
* React
* TypeScript
* shadcn/ui
* Tailwind CSS
* Recharts

Use **shadcn/ui** for UI components.

Tailwind is used for layout/composition.

## Backend

* Node.js
* TypeScript
* AWS SDK v3

## AWS

Progressively introduce:

* S3
* Lambda
* API Gateway
* DynamoDB
* IAM
* CloudWatch
* CloudTrail
* EventBridge
* SQS
* EC2
* VPC
* RDS
* ALB
* Auto Scaling
* Route 53
* CloudFront

Do **not** introduce all services at once.

Each AWS service should be introduced because the application has a reason to use it.

---

# 7. Monorepo structure

Current intended structure:

```text
csv-insight/
│
├── apps/
│   ├── web/
│   │   └── Next.js application
│   │
│   └── api/
│       └── Node.js API
│
├── packages/
│   ├── analyzer/
│   │   └── CSV analysis logic
│   │
│   └── types/
│       └── shared TypeScript types
│
├── infrastructure/
│   └── Terraform later
│
├── docs/
│   ├── architecture/
│   ├── aws/
│   └── interview/
│
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

Adapt this to the actual repository rather than blindly recreating it.

---

# 8. Important architectural principle

The CSV analyzer should **not depend on AWS**.

We want:

```text
S3
 ↓
CSV data
 ↓
Analyzer
 ↓
Analysis result
```

rather than:

```text
Analyzer
 ↓
AWS SDK
 ↓
S3
```

The analyzer should remain reusable and testable locally.

This will become especially important when the same analyzer is eventually executed inside Lambda or an EC2 worker.

---

# 9. AWS learning roadmap

The project will evolve in phases.

## Phase 1 — Local application

Already completed.

Architecture:

```text
Browser
 ↓
Next.js
 ↓
Node.js API
 ↓
CSV Analyzer
 ↓
Dataset + Analysis
```

The application already works.

It includes:

* CSV upload
* CSV analysis
* actual dataset table
* search
* filtering
* sorting
* pagination
* statistics
* charts

---

# 10. Phase 2 — Amazon S3

**Current phase.**

Goal:

> Store uploaded CSV files in S3.

Target:

```text
Browser
 ↓
Next.js
 ↓
Node.js API
 ↓
S3
 ↓
CSV object
```

The backend should:

1. Receive CSV
2. Generate unique S3 object key
3. Upload CSV to S3
4. Read CSV from S3
5. Pass CSV to existing analyzer
6. Return analysis/dataset to frontend

The user experience should remain almost identical to Phase 1.

---

# 11. Current AWS S3 status

An S3 bucket has already been created.

The bucket is intended to be:

* Private
* Block Public Access enabled
* ACLs disabled / bucket-owner enforced
* Default encryption enabled
* Region should remain consistent with the rest of the project

Example bucket:

```text
csv-insight-data-<unique-name>
```

Do not assume the exact bucket name unless I provide it.

---

# 12. Current Phase 2 architecture

Currently moving toward:

```text
Browser
   ↓
Next.js
   ↓
Node.js API
   ↓
AWS SDK v3
   ↓
Amazon S3
```

The API will use:

```text
@aws-sdk/client-s3
```

This package has been approved for installation.

Install only in the API package:

```bash
pnpm --filter api add @aws-sdk/client-s3
```

Do not add unnecessary AWS packages yet.

---

# 13. Current Phase 2 S3 service

We want a clean S3 abstraction.

Something conceptually like:

```text
apps/api/src/
  lib/
    s3.ts

  services/
    s3.service.ts
```

S3 client:

```ts
import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});
```

Environment variables:

```env
AWS_REGION=ap-south-1
S3_BUCKET_NAME=<bucket-name>
```

Never hardcode AWS credentials.

Never expose AWS credentials to the browser.

---

# 14. S3 operations

Initially we need:

```text
s3:PutObject
s3:GetObject
```

Potentially later:

```text
s3:ListBucket
```

Important distinction:

```text
s3:PutObject
→ upload object

s3:GetObject
→ read object

s3:ListBucket
→ list objects in bucket
```

Bucket ARN and object ARN are different.

Example:

```text
Bucket:
arn:aws:s3:::my-bucket

Object:
arn:aws:s3:::my-bucket/uploads/file.csv
```

---

# 15. S3 object structure

We should not use the original filename as the only key.

Use something like:

```text
uploads/{unique-id}/{original-file-name}
```

Example:

```text
uploads/
  7c3b2f/
    sales.csv
```

The application should retain the original filename as metadata if useful.

---

# 16. IAM learning principle

This is extremely important.

There are two different concepts:

### My IAM user

Used by me to configure AWS resources.

```text
Me
 ↓
IAM User
 ↓
AWS Console / CLI
```

### Application IAM role

Used by the application runtime.

Eventually:

```text
Lambda
 ↓
IAM Role
 ↓
S3
```

Do not create an application IAM user just because it is easy.

The eventual architecture should use **IAM roles**.

We should learn:

* IAM user
* IAM role
* trust policy
* permissions policy
* resource policy
* ARN
* explicit deny
* least privilege
* PassRole
* credential provider chain

---

# 17. Current local authentication approach

For local development, use the normal AWS credential provider chain.

Do **not**:

```text
hardcode access key
hardcode secret key
put credentials in React
commit credentials to Git
```

The AWS SDK should obtain credentials through standard AWS configuration.

Later, when running in AWS:

```text
Lambda
 ↓
IAM execution role
 ↓
temporary AWS credentials
 ↓
S3
```

This difference is important for interviews.

---

# 18. Phase 3 — Lambda

After S3 works:

```text
S3
 ↓
S3 ObjectCreated event
 ↓
Lambda
 ↓
CSV Analyzer
 ↓
DynamoDB eventually
```

Lambda will process uploaded datasets.

Learn:

* Lambda
* runtime
* handler
* execution role
* trigger
* environment variables
* timeout
* memory
* cold start
* concurrency
* logs
* failures
* retries

---

# 19. Phase 4 — DynamoDB

Store analysis metadata:

```text
datasetId
filename
status
rowCount
columnCount
missingValues
duplicateCount
columns
statistics
createdAt
```

Architecture:

```text
Lambda
 ↓
DynamoDB
```

Learn:

* partition key
* sort key
* item
* attributes
* Query
* Scan
* indexes
* capacity
* NoSQL design

Important architecture principle:

**Don't store the entire CSV in DynamoDB.**

Keep the original dataset in S3.

Use DynamoDB for structured metadata and analysis results.

---

# 20. Phase 5 — API Gateway

Eventually:

```text
Next.js
 ↓
API Gateway
 ↓
Lambda
 ├── S3
 └── DynamoDB
```

Potential APIs:

```text
POST /datasets
GET /datasets
GET /datasets/:id
GET /datasets/:id/data
```

Learn:

* REST API
* HTTP methods
* API Gateway
* Lambda integration
* CORS
* throttling
* errors

---

# 21. Phase 6 — IAM deep dive

Create least-privilege roles.

Example Lambda role:

```text
S3:
  GetObject

DynamoDB:
  PutItem
  UpdateItem

CloudWatch:
  log permissions
```

Don't use AdministratorAccess for application runtime.

Intentionally test permissions.

For example:

```text
Remove s3:GetObject
 ↓
Run application
 ↓
AccessDenied
 ↓
Understand why
 ↓
Fix IAM
```

This is part of interview preparation.

---

# 22. Phase 7 — CloudWatch

Monitor Lambda:

```text
Invocations
Errors
Duration
Throttles
Memory
Logs
```

Create alarms.

Learn:

* Logs
* Metrics
* Alarms
* Monitoring
* Troubleshooting

---

# 23. Phase 8 — EventBridge + SQS

Potential architecture:

```text
S3
 ↓
EventBridge
 ↓
SQS
 ↓
Lambda
 ↓
DynamoDB
```

Learn:

* event-driven architecture
* queues
* producer
* consumer
* retry
* visibility timeout
* dead-letter queue
* asynchronous processing

---

# 24. Phase 9 — EC2

Introduce EC2 as an alternative processing engine.

Reason:

> What if CSV processing becomes too large/long-running for Lambda?

Architecture:

```text
S3
 ↓
SQS
 ↓
EC2 Worker
 ↓
S3 / DynamoDB
```

Learn:

* AMI
* instance types
* key pair
* security groups
* EBS
* instance storage
* user data
* IAM instance role
* Elastic IP
* SSH
* EC2 networking

Then compare:

```text
Lambda vs EC2
```

---

# 25. Phase 10 — VPC

Create proper networking:

```text
VPC
│
├── Public subnet
│
└── Private subnet
      │
      └── EC2
```

Learn:

* VPC
* CIDR
* subnet
* route table
* Internet Gateway
* NAT Gateway
* public/private subnet
* security groups
* NACL
* VPC endpoint
* VPC peering
* Transit Gateway
* bastion/jump server

This connects the project to the networking concepts already learned.

---

# 26. Phase 11 — RDS

Introduce RDS for a separate relational use case.

Learn:

* RDS
* database engine
* subnet group
* security
* backups
* Multi-AZ
* storage
* IOPS
* connections

Use this to understand:

```text
DynamoDB vs RDS
```

rather than adding RDS just for the sake of adding it.

---

# 27. Phase 12 — ALB + Auto Scaling

Architecture:

```text
             ALB
              │
       ┌──────┴──────┐
       ▼             ▼
     EC2 #1        EC2 #2
       │             │
       └──────┬──────┘
              ▼
             SQS
```

Then:

```text
High workload
 ↓
Auto Scaling Group
 ↓
more EC2 instances
```

Learn:

* ALB
* target groups
* health checks
* launch templates
* Auto Scaling Groups
* scaling policies
* high availability
* stress testing

---

# 28. Phase 13 — Route 53 + CloudFront

Eventually:

```text
User
 ↓
Route 53
 ↓
CloudFront
 ↓
Next.js
```

Learn:

* DNS
* hosted zones
* records
* TTL
* CDN
* caching
* HTTPS

---

# 29. Phase 14 — CloudTrail

Use CloudTrail to answer:

```text
Who changed the S3 bucket?

Who changed IAM?

Who created an EC2 instance?

Who modified a security group?
```

Learn:

* API calls
* management events
* event history
* auditing
* security investigation

---

# 30. DevOps comes later

Do **not** mix DevOps into the application initially.

First learn AWS architecture.

After the AWS architecture is understood, turn the same project into a DevOps project.

Potential later architecture:

```text
GitHub
 ↓
CI/CD
 ↓
Tests
 ↓
Docker
 ↓
ECR
 ↓
EC2 / EKS
```

Then:

```text
Terraform
 ↓
AWS infrastructure
```

And later:

```text
Prometheus
+
Grafana
```

Possible topics:

* GitHub Actions
* Jenkins
* Docker
* ECR
* ECS
* EKS
* Kubernetes
* Terraform
* CI/CD
* monitoring
* observability

---

# 31. How I want AI to teach me

This is very important.

**Do not just give me code.**

I am using this project to become interview-ready.

Whenever introducing an AWS service, explain:

### 1. What is it?

Simple beginner explanation.

### 2. Why do we need it?

Connect it directly to CSV Insight.

### 3. How does it work?

Explain the request/data flow.

### 4. Who accesses it?

Explain:

* IAM user
* IAM role
* AWS service principal

as appropriate.

### 5. What permissions are required?

Explain the specific IAM actions.

### 6. What happens internally?

Explain the AWS request flow.

### 7. What can go wrong?

Show realistic errors.

### 8. How do we troubleshoot?

Use AWS Console/CLI/logs.

### 9. How would I explain this in an interview?

Give a concise interview answer.

### 10. What follow-up questions might an interviewer ask?

Provide likely questions and answers.

---

# 32. Hands-on learning rule

Every AWS hands-on step must explicitly state:

```text
Principal:
IAM user / IAM role / root

Why:
Why this principal is being used

Action:
What we're doing

Permission:
What permission is required

Resource:
Which AWS resource is affected

Why:
Why this permission is necessary
```

Especially distinguish:

```text
Root user
IAM user
IAM role
Service role
Resource-based policy
Identity-based policy
```

---

# 33. Don't over-engineer

This is a learning project, not a production startup.

Keep the application small.

Don't introduce a service just because it exists.

Every AWS service should answer:

> **What problem does this service solve in this application?**

If there is no good answer, don't add it.

---

# 34. Current exact status

### Completed

* Project selected: **CSV Insight**
* Phase 1 application completed
* Turborepo setup completed
* Next.js frontend completed
* Node.js backend completed
* CSV upload implemented
* Dataset table implemented
* Search/filter implemented
* Analysis implemented
* Charts implemented
* S3 bucket created

### Currently working on

**Phase 2 — S3 integration**

The next implementation task is:

```text
Install:
@aws-sdk/client-s3

Then:

Node.js API
 ↓
AWS SDK v3
 ↓
S3
```

The user has already asked Copilot to implement Phase 2.

The Copilot implementation should:

1. Inspect the existing repository.
2. Find the current upload flow.
3. Add `@aws-sdk/client-s3` to the API package.
4. Create an S3 client.
5. Add S3 service abstraction.
6. Add `AWS_REGION`.
7. Add `S3_BUCKET_NAME`.
8. Upload CSV to S3.
9. Read CSV back from S3.
10. Send it through the existing analyzer.
11. Preserve the existing frontend behavior.
12. Add tests.
13. Add documentation.
14. Not introduce Lambda/DynamoDB/API Gateway/etc. yet.

---

# 35. Current Phase 2 target

The immediate target is:

```text
                  CSV
                   │
                   ▼
              Next.js
                   │
                   ▼
              Node.js API
                   │
                   ▼
          @aws-sdk/client-s3
                   │
             ┌─────┴─────┐
             │           │
         PutObject    GetObject
             │           │
             ▼           ▼
             └──── S3 ───┘
                   │
                   ▼
             CSV Analyzer
                   │
                   ▼
          Analysis + Dataset
                   │
                   ▼
                UI
```

Once this works, **stop** and verify it thoroughly before moving to Lambda.

---

# 36. Critical instructions for the next AI

When I paste this context into another AI, **do not restart the project from scratch**.

The project is already in progress.

The next task is:

> **Continue Phase 2 S3 integration from the current state.**

First inspect the repository/current implementation.

If Copilot has already made changes, inspect those changes before modifying anything.

Don't recreate files unnecessarily.

Don't introduce later AWS services.

Don't redesign the application.

Keep teaching me while implementing.

The goal is:

> **Build a simple application while progressively learning AWS deeply enough to become interview-ready.**
