import assert from "node:assert/strict";
import test from "node:test";
import { GetObjectCommand, PutObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import { analyzeCsv } from "@csv-insight/analyzer";
import { getS3Config, S3ConfigurationError } from "../lib/s3.js";
import { createS3ObjectKey, S3Service, S3StorageError } from "./s3.service.js";

type S3CommandClient = Pick<S3Client, "send">;

function withS3Environment(): void {
	process.env.AWS_REGION = "ap-south-1";
	process.env.S3_BUCKET_NAME = "csv-insight-test";
}

test("creates a safe unique object key", () => {
	assert.equal(
		createS3ObjectKey("dataset-id", "Quarterly report (final).csv"),
		"uploads/dataset-id/Quarterly-report-final-.csv",
	);
});

test("uses configured bucket and constructs PutObject correctly", async () => {
	withS3Environment();
	const commands: unknown[] = [];
	const client = { send: async (command: unknown) => { commands.push(command); return {}; } } as S3CommandClient;
	const service = new S3Service(client);
	await service.uploadCsv("uploads/id/file.csv", Buffer.from("name\nAda\n"));
	const command = commands[0];
	assert.ok(command instanceof PutObjectCommand);
	assert.deepEqual(command.input, {
		Bucket: "csv-insight-test",
		Key: "uploads/id/file.csv",
		Body: Buffer.from("name\nAda\n"),
		ContentType: "text/csv",
	});
});

test("downloads CSV content with GetObject", async () => {
	withS3Environment();
	let command: unknown;
	const client = { send: async (nextCommand: unknown) => { command = nextCommand; return { Body: { transformToString: async () => "name\nAda\n" } }; } } as S3CommandClient;
	const service = new S3Service(client);
	assert.equal(await service.readCsv("uploads/id/file.csv"), "name\nAda\n");
	assert.ok(command instanceof GetObjectCommand);
	assert.deepEqual(command.input, { Bucket: "csv-insight-test", Key: "uploads/id/file.csv" });
});

test("wraps S3 operation failures without leaking provider details", async () => {
	withS3Environment();
	const client = { send: async () => { throw new Error("provider detail"); } } as S3CommandClient;
	await assert.rejects(
		new S3Service(client).uploadCsv("uploads/id/file.csv", Buffer.from("name\nAda\n")),
		(error: unknown) => error instanceof S3StorageError && error.operation === "upload",
	);
});

test("requires S3 region and bucket configuration", () => {
	assert.throws(
		() => getS3Config({ AWS_REGION: "ap-south-1" }),
		S3ConfigurationError,
	);
});

test("keeps the analyzer independent of S3 CSV storage", async () => {
	const analysis = await analyzeCsv("name,score\nAda,10\n");
	assert.equal(analysis.dataset.rowCount, 1);
	assert.equal(analysis.dataset.columnCount, 2);
});
