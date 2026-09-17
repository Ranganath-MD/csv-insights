# Interview Notes

Phase 2 uses a private S3 bucket for original CSV objects. Be ready to explain the
difference between a bucket, object, and object key; why application credentials
belong only on the server; and why `s3:GetObject` does not include `s3:ListBucket`.

For troubleshooting, `AccessDenied` normally points to an IAM or bucket-policy
mismatch for the requested action and object key. In production an IAM role with
only `s3:PutObject` and `s3:GetObject` for the upload prefix is preferable to an
IAM user with long-lived credentials.
