import { S3Client } from "@aws-sdk/client-s3";

export class S3ConfigurationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "S3ConfigurationError";
	}
}

export type S3Config = {
	region: string;
	bucketName: string;
};

export function getS3Config(environment = process.env): S3Config {
	const region = environment.AWS_REGION?.trim();
	const bucketName = environment.S3_BUCKET_NAME?.trim();
	if (!region || !bucketName) {
		throw new S3ConfigurationError(
			"AWS_REGION and S3_BUCKET_NAME must be configured for S3 storage.",
		);
	}
	return { region, bucketName };
}

export function createS3Client(region: string): S3Client {
	return new S3Client({ region });
}
