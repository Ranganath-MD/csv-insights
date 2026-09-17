# Amazon S3 — Phase 2

Amazon S3 is AWS object storage. CSV Insight uses it to persist each original CSV
outside the API process, so files survive API restarts. A **bucket** is the storage
container; an **object** is one stored file. Its **object key** is its path-like
identifier, for example `uploads/<dataset-id>/sales.csv`.

The API uses `PutObject` to write the uploaded CSV and `GetObject` to download it
again before analysis or table reads. The bucket stays private: public access is not
needed because only the backend reads objects. Browser code never receives AWS
credentials or an S3 client.

For local development, the AWS SDK uses the standard credential provider chain:
AWS SSO, an AWS profile, environment-based credentials, or another supported local
provider. An IAM **user** is a long-lived human or program identity; an IAM **role**
is an assumable, temporary-permission identity and is preferred for deployed
workloads. The application needs only `s3:PutObject` and `s3:GetObject` on its
object prefix. `s3:ListBucket` lists keys in a bucket; `s3:GetObject` reads a known
object and does not grant listing permission.

`AccessDenied` means the active identity lacks permission, the bucket policy blocks
the request, or the requested key/prefix is outside the allowed scope. Check the
configured region and bucket, run `aws sts get-caller-identity` to confirm the local
identity, then verify the identity and bucket policies allow the needed action on
the exact object ARN. Never solve this by using public access or broad
AdministratorAccess permissions.

If the desired local identity is not the `default` AWS profile, configure and sign
into it with AWS CLI, then set its name as `AWS_PROFILE` in `apps/api/.env`. This
selects an identity without placing access keys in application configuration.
