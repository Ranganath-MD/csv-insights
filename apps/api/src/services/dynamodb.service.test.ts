import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildAnalysisRecord } from "./dynamodb.service.js";

describe("buildAnalysisRecord", () => {
	it("serializes dataset analysis into a DynamoDB-ready record", () => {
		const record = buildAnalysisRecord({
			datasetId: "ds-123",
			filename: "sample.csv",
			analysis: {
				dataset: {
					rowCount: 3,
					columnCount: 2,
					fileSizeBytes: 128,
					missingValueCount: 1,
					duplicateRowCount: 0,
				},
				columns: [
					{
						columnName: "name",
						detectedType: "string",
						missingValues: 1,
					},
				],
			},
			status: "processed",
			uploadedAt: "2026-09-17T00:00:00.000Z",
		});

		assert.ok(record.datasetId?.S === "ds-123");
		assert.ok(record.filename?.S === "sample.csv");
		assert.ok(record.status?.S === "processed");
		assert.equal(typeof record.analysis?.S, "string");
		assert.ok((record.analysis?.S ?? "").includes('"rowCount":3'));
		assert.equal(record.uploadedAt?.S, "2026-09-17T00:00:00.000Z");
		assert.equal(Object.keys(record).length, 5);
	});
});
