import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { analyzeCsv, createPlaceholderAnalysis } from "@csv-insight/analyzer";
import type {
	DatasetAnalysisResponse,
	DatasetDetailResponse,
	DatasetMetadata,
	DatasetRow,
	DatasetRowsResponse,
	ListDatasetsResponse,
	UploadDatasetResponse,
} from "@csv-insight/types";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { mergeDatasetSources } from "./lib/dataset-source.js";
import { S3ConfigurationError } from "./lib/s3.js";
import {
	DynamoDBService,
	hydrateDatasetRecord,
} from "./services/dynamodb.service.js";
import {
	createS3ObjectKey,
	S3Service,
	S3StorageError,
} from "./services/s3.service.js";

const port = Number(process.env.PORT ?? 4000);
const app = new Hono();
type StoredDataset = DatasetMetadata & {
	s3ObjectKey: string;
};

const datasets = new Map<string, StoredDataset>();

async function getStoredDatasetById(
	datasetId: string,
): Promise<StoredDataset | null> {
	try {
		const record = await new DynamoDBService().getDatasetById(datasetId);
		if (record) {
			const hydrated = hydrateDatasetRecord(record);
			if (hydrated) {
				return {
					...hydrated,
					s3ObjectKey: createS3ObjectKey(datasetId, record.filename),
				};
			}
		}
	} catch {
		// Fall through to the in-memory dataset cache below.
	}

	const localDataset = datasets.get(datasetId);
	if (localDataset) {
		return localDataset;
	}

	return null;
}

async function listStoredDatasets(): Promise<StoredDataset[]> {
	const localDatasets = Array.from(datasets.values());

	try {
		const persistedRecords = await new DynamoDBService().listDatasets();
		const persistedDatasets = persistedRecords
			.map((record) => {
				const hydrated = hydrateDatasetRecord(record);
				if (!hydrated) {
					return null;
				}
				return {
					...hydrated,
					s3ObjectKey: createS3ObjectKey(record.datasetId, record.filename),
				};
			})
			.filter((dataset): dataset is StoredDataset => dataset !== null);

		return mergeDatasetSources(localDatasets, persistedDatasets);
	} catch {
		return localDatasets;
	}
}

function getBasicCsvShape(csvText: string): {
	rowCount: number;
	columnCount: number;
} {
	const trimmed = csvText.trim();
	if (trimmed.length === 0) {
		return { rowCount: 0, columnCount: 0 };
	}

	const lines = trimmed
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	if (lines.length === 0) {
		return { rowCount: 0, columnCount: 0 };
	}

	const headerLine = lines[0];
	if (typeof headerLine !== "string") {
		return { rowCount: 0, columnCount: 0 };
	}

	const headerColumns = headerLine.split(",");
	return {
		rowCount: Math.max(lines.length - 1, 0),
		columnCount: headerColumns.length,
	};
}

function toDatasetMetadata(dataset: StoredDataset): DatasetMetadata {
	return {
		id: dataset.id,
		originalFileName: dataset.originalFileName,
		uploadedAt: dataset.uploadedAt,
		fileSizeBytes: dataset.fileSizeBytes,
		rowCount: dataset.rowCount,
		columnCount: dataset.columnCount,
	};
}

function parseCsvCell(value: string): string | number | boolean | null {
	const trimmed = value.trim();
	if (trimmed.length === 0) {
		return null;
	}

	if (/^[-+]?\d+(\.\d+)?$/.test(trimmed)) {
		return Number(trimmed);
	}

	if (/^(true|false)$/i.test(trimmed)) {
		return trimmed.toLowerCase() === "true";
	}

	return trimmed;
}

function parseCsvRows(csvText: string): DatasetRow[] {
	const trimmed = csvText.trim();
	if (!trimmed) {
		return [];
	}

	const rows: string[][] = [];
	let currentValue = "";
	let currentRow: string[] = [];
	let inQuotes = false;

	for (let index = 0; index < csvText.length; index += 1) {
		const char = csvText[index];
		const nextChar = csvText[index + 1];

		if (char === '"') {
			if (inQuotes && nextChar === '"') {
				currentValue += '"';
				index += 1;
			} else {
				inQuotes = !inQuotes;
			}
			continue;
		}

		if (char === "," && !inQuotes) {
			currentRow.push(currentValue);
			currentValue = "";
			continue;
		}

		if ((char === "\n" || char === "\r") && !inQuotes) {
			if (char === "\r" && nextChar === "\n") {
				index += 1;
			}

			currentRow.push(currentValue);
			currentValue = "";

			if (currentRow.some((cell) => cell.trim().length > 0)) {
				rows.push(currentRow);
			}
			currentRow = [];
			continue;
		}

		currentValue += char;
	}

	if (currentValue.length > 0 || currentRow.length > 0) {
		currentRow.push(currentValue);
		if (currentRow.some((cell) => cell.trim().length > 0)) {
			rows.push(currentRow);
		}
	}

	if (rows.length === 0) {
		return [];
	}

	const [headerRow, ...dataRows] = rows;
	if (!headerRow) {
		return [];
	}

	const normalizedHeaders = headerRow.map((header, headerIndex) => {
		const value = header.trim();
		return value.length > 0 ? value : `column_${headerIndex + 1}`;
	});

	return dataRows
		.filter((row) => row.some((cell) => cell.trim().length > 0))
		.map((row) => {
			const record: DatasetRow = {};
			normalizedHeaders.forEach((header, index) => {
				record[header] = parseCsvCell(row[index] ?? "");
			});
			return record;
		});
}

function hasBalancedCsvQuotes(csvText: string): boolean {
	let inQuotes = false;
	for (let index = 0; index < csvText.length; index += 1) {
		if (csvText[index] !== '"') continue;
		if (inQuotes && csvText[index + 1] === '"') {
			index += 1;
			continue;
		}
		inQuotes = !inQuotes;
	}
	return !inQuotes;
}

function storageErrorResponse(error: unknown, operation: "upload" | "read") {
	if (error instanceof S3ConfigurationError) {
		console.error("S3 configuration error:", error.message);
		return { status: 503 as const, error: "S3 storage is not configured." };
	}
	if (error instanceof S3StorageError) {
		console.error(`S3 ${error.operation} error:`, error.cause);
	}
	return {
		status: 502 as const,
		error:
			operation === "upload"
				? "Unable to store the dataset in S3."
				: "Unable to read the dataset from S3.",
	};
}

app.use("*", cors());

app.get("/", (c) => {
	return c.json({
		service: "csv-insight-api",
		status: "ok",
		endpoints: {
			health: "/health",
			placeholderAnalysis: "/analysis/placeholder",
			uploadDataset: "POST /datasets",
			listDatasets: "GET /datasets",
			datasetDetail: "GET /datasets/:id",
			datasetAnalysis: "GET /datasets/:id/analysis",
		},
	});
});

app.post("/datasets", async (c) => {
	let formData: FormData;
	try {
		formData = await c.req.formData();
	} catch {
		return c.json({ error: "Expected multipart/form-data" }, 400);
	}

	const fileValue = formData.get("file");
	if (!(fileValue instanceof File)) {
		return c.json({ error: "Missing file field" }, 400);
	}

	if (fileValue.size === 0) {
		return c.json({ error: "Uploaded file is empty" }, 400);
	}

	const fileExtension = extname(fileValue.name).toLowerCase();
	if (fileExtension !== ".csv") {
		return c.json({ error: "Only CSV files are supported" }, 400);
	}
	const datasetId = randomUUID();
	const fileBuffer = Buffer.from(await fileValue.arrayBuffer());
	const csvText = fileBuffer.toString("utf8");
	if (csvText.trim().length === 0) {
		return c.json({ error: "Uploaded CSV is empty" }, 400);
	}
	if (!hasBalancedCsvQuotes(csvText)) {
		return c.json({ error: "Uploaded CSV is invalid" }, 400);
	}

	const s3ObjectKey = createS3ObjectKey(datasetId, fileValue.name);
	try {
		const s3 = new S3Service();
		await s3.uploadCsv(s3ObjectKey, fileBuffer);
	} catch (error) {
		const response = storageErrorResponse(
			error,
			error instanceof S3StorageError ? error.operation : "upload",
		);
		return c.json({ error: response.error }, response.status);
	}

	const uploadedAt = new Date().toISOString();
	const datasetShape = getBasicCsvShape(csvText);
	datasets.set(datasetId, {
		id: datasetId,
		originalFileName: fileValue.name,
		uploadedAt,
		fileSizeBytes: fileBuffer.length,
		rowCount: datasetShape.rowCount,
		columnCount: datasetShape.columnCount,
		s3ObjectKey,
	});

	const payload: UploadDatasetResponse = {
		datasetId,
		filename: fileValue.name,
		status: "processing",
		uploadedAt,
	};

	return c.json(payload, 201);
});

app.get("/datasets", async (c) => {
	const allDatasets = await listStoredDatasets();
	const payload: ListDatasetsResponse = {
		datasets: allDatasets.map((dataset) => toDatasetMetadata(dataset)),
	};

	return c.json(payload);
});

app.get("/datasets/:id", async (c) => {
	const datasetId = c.req.param("id");
	const dataset = await getStoredDatasetById(datasetId);

	if (!dataset) {
		return c.json({ error: "Dataset not found" }, 404);
	}

	const payload: DatasetDetailResponse = {
		dataset: toDatasetMetadata(dataset),
	};

	return c.json(payload);
});

app.get("/datasets/:id/rows", async (c) => {
	const datasetId = c.req.param("id");
	const dataset = await getStoredDatasetById(datasetId);

	if (!dataset) {
		return c.json({ error: "Dataset not found" }, 404);
	}

	const page = Math.max(1, Number(c.req.query("page") ?? 1) || 1);
	const pageSize = Math.min(
		100,
		Math.max(1, Number(c.req.query("pageSize") ?? 100) || 100),
	);
	const searchTerm = (c.req.query("search") ?? "").trim().toLowerCase();
	const sortBy = c.req.query("sortBy") ?? "";
	const sortDirection =
		c.req.query("sortDirection") === "desc" ? "desc" : "asc";

	let csvText: string;
	try {
		csvText = await new S3Service().readCsv(dataset.s3ObjectKey);
	} catch (error) {
		const response = storageErrorResponse(error, "read");
		return c.json({ error: response.error }, response.status);
	}
	let rows = parseCsvRows(csvText);

	if (searchTerm) {
		rows = rows.filter((row) =>
			Object.values(row).some((value) => {
				if (value === null || value === undefined) {
					return false;
				}
				return String(value).toLowerCase().includes(searchTerm);
			}),
		);
	}

	if (sortBy) {
		rows = [...rows].sort((left, right) => {
			const leftValue = left[sortBy];
			const rightValue = right[sortBy];
			const normalizedLeft =
				leftValue === null || leftValue === undefined ? "" : String(leftValue);
			const normalizedRight =
				rightValue === null || rightValue === undefined
					? ""
					: String(rightValue);
			const leftNumber = Number(normalizedLeft);
			const rightNumber = Number(normalizedRight);
			const bothNumeric =
				!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber);

			const comparison = bothNumeric
				? leftNumber - rightNumber
				: normalizedLeft.localeCompare(normalizedRight, undefined, {
						numeric: true,
						sensitivity: "base",
					});

			return sortDirection === "desc" ? comparison * -1 : comparison;
		});
	}

	const totalRows = rows.length;
	const startIndex = (page - 1) * pageSize;
	const paginatedRows = rows.slice(startIndex, startIndex + pageSize);

	const payload: DatasetRowsResponse = {
		datasetId,
		page,
		pageSize,
		totalRows,
		rows: paginatedRows,
	};

	return c.json(payload);
});

app.get("/datasets/:id/analysis", async (c) => {
	const datasetId = c.req.param("id");
	const dataset = await getStoredDatasetById(datasetId);

	if (!dataset) {
		return c.json({ error: "Dataset not found" }, 404);
	}

	let csvText: string;
	try {
		csvText = await new S3Service().readCsv(dataset.s3ObjectKey);
	} catch (error) {
		const response = storageErrorResponse(error, "read");
		return c.json({ error: response.error }, response.status);
	}
	const analysis = await analyzeCsv(csvText);
	try {
		await new DynamoDBService().saveAnalysis({
			datasetId,
			filename: dataset.originalFileName,
			analysis,
			status: "processed",
			uploadedAt: dataset.uploadedAt,
		});
	} catch (error) {
		console.error("DynamoDB analysis persistence failed:", error);
	}
	const payload: DatasetAnalysisResponse = {
		datasetId,
		analysis,
	};

	return c.json(payload);
});

app.get("/health", (c) => {
	return c.json({ status: "ok", service: "api" });
});

app.get("/analysis/placeholder", (c) => {
	return c.json(createPlaceholderAnalysis());
});

app.notFound((c) => {
	return c.json({ error: "Not found" }, 404);
});

serve({ fetch: app.fetch, port }, () => {
	// eslint-disable-next-line no-console
	console.log(`API listening on http://localhost:${port}`);
});
