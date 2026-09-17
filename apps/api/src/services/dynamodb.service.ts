import {
	type AttributeValue,
	DynamoDBClient,
	PutItemCommand,
	QueryCommand,
	ScanCommand,
} from "@aws-sdk/client-dynamodb";
import type { DatasetAnalysisSummary } from "@csv-insight/types";

export class DynamoDBConfigurationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "DynamoDBConfigurationError";
	}
}

export type DynamoDBAnalysisRecordInput = {
	datasetId: string;
	filename: string;
	analysis: DatasetAnalysisSummary;
	status: "processing" | "processed";
	uploadedAt: string;
};

export type DynamoDBDatasetRecord = {
	datasetId: string;
	filename: string;
	analysis: string;
	status: string;
	uploadedAt: string;
};

export function getDynamoDBConfig(environment = process.env): {
	region: string;
	tableName: string;
} {
	const region = environment.AWS_REGION?.trim();
	const tableName = environment.DYNAMODB_TABLE_NAME?.trim();
	if (!region || !tableName) {
		throw new DynamoDBConfigurationError(
			"AWS_REGION and DYNAMODB_TABLE_NAME must be configured for DynamoDB persistence.",
		);
	}
	return { region, tableName };
}

export function parseAnalysisSummary(
	rawAnalysis: string,
): DatasetAnalysisSummary | null {
	try {
		const parsed = JSON.parse(rawAnalysis) as DatasetAnalysisSummary;
		if (
			parsed &&
			typeof parsed === "object" &&
			"dataset" in parsed &&
			"columns" in parsed
		) {
			return parsed;
		}
		return null;
	} catch {
		return null;
	}
}

export function buildAnalysisRecord({
	datasetId,
	filename,
	analysis,
	status,
	uploadedAt,
}: DynamoDBAnalysisRecordInput): Record<string, AttributeValue> {
	return {
		datasetId: { S: datasetId },
		analysis: { S: JSON.stringify(analysis) },
		filename: { S: filename },
		status: { S: status },
		uploadedAt: { S: uploadedAt },
	};
}

export function hydrateDatasetRecord(record: DynamoDBDatasetRecord): {
	id: string;
	originalFileName: string;
	uploadedAt: string;
	fileSizeBytes: number;
	rowCount: number;
	columnCount: number;
} | null {
	const analysis = parseAnalysisSummary(record.analysis);
	if (!analysis) {
		return null;
	}

	return {
		id: record.datasetId,
		originalFileName: record.filename,
		uploadedAt: record.uploadedAt,
		fileSizeBytes: analysis.dataset.fileSizeBytes,
		rowCount: analysis.dataset.rowCount,
		columnCount: analysis.dataset.columnCount,
	};
}

function normalizeDatasetRecord(
	item: Record<string, AttributeValue> | undefined,
): DynamoDBDatasetRecord | null {
	if (!item) {
		return null;
	}

	const datasetId = item.datasetId?.S;
	const filename = item.filename?.S;
	const analysis = item.analysis?.S;
	const status = item.status?.S ?? "processed";
	const uploadedAt = item.uploadedAt?.S ?? new Date().toISOString();
	if (!datasetId || !filename || !analysis) {
		return null;
	}

	return {
		datasetId,
		filename,
		analysis,
		status,
		uploadedAt,
	};
}

export class DynamoDBService {
	private readonly client: Pick<DynamoDBClient, "send">;
	private readonly tableName: string;

	constructor(client?: Pick<DynamoDBClient, "send">, tableName?: string) {
		const config = getDynamoDBConfig();
		this.client = client ?? new DynamoDBClient({ region: config.region });
		this.tableName = tableName ?? config.tableName;
	}

	async saveAnalysis(input: DynamoDBAnalysisRecordInput): Promise<void> {
		await this.client.send(
			new PutItemCommand({
				TableName: this.tableName,
				Item: buildAnalysisRecord(input),
			}),
		);
	}

	async getDatasetById(
		datasetId: string,
	): Promise<DynamoDBDatasetRecord | null> {
		const response = await this.client.send(
			new QueryCommand({
				TableName: this.tableName,
				KeyConditionExpression: "datasetId = :datasetId",
				ExpressionAttributeValues: {
					":datasetId": { S: datasetId },
				},
			}),
		);

		return normalizeDatasetRecord(response.Items?.[0]);
	}

	async listDatasets(): Promise<DynamoDBDatasetRecord[]> {
		const response = await this.client.send(
			new ScanCommand({
				TableName: this.tableName,
			}),
		);

		return (response.Items ?? [])
			.map((item) => normalizeDatasetRecord(item))
			.filter((item): item is DynamoDBDatasetRecord => item !== null);
	}
}
