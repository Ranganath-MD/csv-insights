import {
	GetObjectCommand,
	PutObjectCommand,
	type S3Client,
} from "@aws-sdk/client-s3";
import { createS3Client, getS3Config } from "../lib/s3.js";

type S3CommandClient = Pick<S3Client, "send">;

export class S3StorageError extends Error {
	constructor(
		public readonly operation: "upload" | "read",
		cause: unknown,
	) {
		super(`S3 ${operation} operation failed.`);
		this.name = "S3StorageError";
		this.cause = cause;
	}
}

function hasTransformToString(
	body: unknown,
): body is { transformToString(encoding?: string): Promise<string> } {
	return (
		typeof body === "object" &&
		body !== null &&
		"transformToString" in body &&
		typeof body.transformToString === "function"
	);
}

export function sanitizeObjectFileName(originalFileName: string): string {
	const sanitized = originalFileName
		.normalize("NFKD")
		.replace(/[^a-zA-Z0-9._-]+/g, "-")
		.replace(/^[.-]+|[.-]+$/g, "");
	return sanitized || "upload.csv";
}

export function createS3ObjectKey(
	datasetId: string,
	originalFileName: string,
): string {
	return `uploads/${datasetId}/${sanitizeObjectFileName(originalFileName)}`;
}

export class S3Service {
	private readonly client: S3CommandClient;
	private readonly bucketName: string;

	constructor(client?: S3CommandClient, bucketName?: string) {
		const config = getS3Config();
		this.client = client ?? createS3Client(config.region);
		this.bucketName = bucketName ?? config.bucketName;
	}

	async uploadCsv(objectKey: string, body: Buffer): Promise<void> {
		try {
			await this.client.send(
				new PutObjectCommand({
					Bucket: this.bucketName,
					Key: objectKey,
					Body: body,
					ContentType: "text/csv",
				}),
			);
		} catch (error) {
			throw new S3StorageError("upload", error);
		}
	}

	async readCsv(objectKey: string): Promise<string> {
		try {
			const response = await this.client.send(
				new GetObjectCommand({ Bucket: this.bucketName, Key: objectKey }),
			);
			const body = (response as { Body?: unknown }).Body;
			if (!hasTransformToString(body)) {
				throw new Error("S3 object response did not include a readable body.");
			}
			return await body.transformToString("utf-8");
		} catch (error) {
			throw new S3StorageError("read", error);
		}
	}
}
