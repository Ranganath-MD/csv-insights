import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { analyzeCsv } from "@csv-insight/analyzer";
import type {
	DatasetAnalysisResponse,
	DatasetDetailResponse,
	DatasetMetadata,
	DatasetRow,
	DatasetRowsResponse,
	UploadDatasetResponse,
} from "@csv-insight/types";
import { HTTPException } from "hono/http-exception";
import { S3ConfigurationError } from "../lib/s3.js";
import {
	datasetRepository,
	type StoredDataset,
} from "../repositories/dataset.repository.js";
import { DynamoDBService } from "./dynamodb.service.js";
import { createS3ObjectKey, S3Service, S3StorageError } from "./s3.service.js";

export function getBasicCsvShape(csvText: string): {
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

export function toDatasetMetadata(dataset: StoredDataset): DatasetMetadata {
	return {
		id: dataset.id,
		originalFileName: dataset.originalFileName,
		uploadedAt: dataset.uploadedAt,
		fileSizeBytes: dataset.fileSizeBytes,
		rowCount: dataset.rowCount,
		columnCount: dataset.columnCount,
	};
}

export function parseCsvCell(value: string): string | number | boolean | null {
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

function pushCsvRow(
	rows: string[][],
	currentRow: string[],
	currentValue: string,
): void {
	const nextRow = [...currentRow, currentValue];
	if (nextRow.some((cell) => cell.trim().length > 0)) {
		rows.push(nextRow);
	}
}

function splitCsvRows(csvText: string): string[][] {
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
				continue;
			}
			inQuotes = !inQuotes;
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
			pushCsvRow(rows, currentRow, currentValue);
			currentRow = [];
			currentValue = "";
			continue;
		}

		currentValue += char;
	}

	pushCsvRow(rows, currentRow, currentValue);
	return rows.filter((row) => row.some((cell) => cell.trim().length > 0));
}

function mapRowToRecord(row: string[], headers: string[]): DatasetRow {
	const record: DatasetRow = {};
	headers.forEach((header, index) => {
		record[header] = parseCsvCell(row[index] ?? "");
	});
	return record;
}

export function parseCsvRows(csvText: string): DatasetRow[] {
	const trimmed = csvText.trim();
	if (!trimmed) {
		return [];
	}

	const rows = splitCsvRows(trimmed);
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

	return dataRows.map((row) => mapRowToRecord(row, normalizedHeaders));
}

export function hasBalancedCsvQuotes(csvText: string): boolean {
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

export function storageErrorResponse(
	error: unknown,
	operation: "upload" | "read",
) {
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

export async function listStoredDatasets(): Promise<StoredDataset[]> {
	return datasetRepository.listDatasets();
}

export async function getStoredDatasetById(
	datasetId: string,
): Promise<StoredDataset | null> {
	return datasetRepository.getDatasetById(datasetId);
}

export async function uploadDatasetRecord(
	file: File,
): Promise<UploadDatasetResponse> {
	if (file.size === 0) {
		throw new HTTPException(400, { message: "Uploaded file is empty" });
	}

	const fileExtension = extname(file.name).toLowerCase();
	if (fileExtension !== ".csv") {
		throw new HTTPException(400, { message: "Only CSV files are supported" });
	}

	const datasetId = randomUUID();
	const fileBuffer = Buffer.from(await file.arrayBuffer());
	const csvText = fileBuffer.toString("utf8");
	if (csvText.trim().length === 0) {
		throw new HTTPException(400, { message: "Uploaded CSV is empty" });
	}
	if (!hasBalancedCsvQuotes(csvText)) {
		throw new HTTPException(400, { message: "Uploaded CSV is invalid" });
	}

	const s3ObjectKey = createS3ObjectKey(datasetId, file.name);
	try {
		await new S3Service().uploadCsv(s3ObjectKey, fileBuffer);
	} catch (error) {
		const response = storageErrorResponse(
			error,
			error instanceof S3StorageError ? error.operation : "upload",
		);
		throw new HTTPException(response.status, { message: response.error });
	}

	const uploadedAt = new Date().toISOString();
	const datasetShape = getBasicCsvShape(csvText);
	const dataset: StoredDataset = {
		id: datasetId,
		originalFileName: file.name,
		uploadedAt,
		fileSizeBytes: fileBuffer.length,
		rowCount: datasetShape.rowCount,
		columnCount: datasetShape.columnCount,
		s3ObjectKey,
	};

	datasetRepository.addLocalDataset(dataset);
	return {
		datasetId,
		filename: file.name,
		status: "processing",
		uploadedAt,
	};
}

export async function getDatasetDetail(
	datasetId: string,
): Promise<DatasetDetailResponse> {
	const dataset = await getStoredDatasetById(datasetId);
	if (!dataset) {
		throw new HTTPException(404, { message: "Dataset not found" });
	}
	return { dataset: toDatasetMetadata(dataset) };
}

export async function getDatasetRows(
	datasetId: string,
	page: number,
	pageSize: number,
	searchTerm: string,
	sortBy: string,
	sortDirection: "asc" | "desc",
): Promise<DatasetRowsResponse> {
	const dataset = await getStoredDatasetById(datasetId);
	if (!dataset) {
		throw new HTTPException(404, { message: "Dataset not found" });
	}

	let csvText: string;
	try {
		csvText = await new S3Service().readCsv(dataset.s3ObjectKey);
	} catch (error) {
		const response = storageErrorResponse(error, "read");
		throw new HTTPException(response.status, { message: response.error });
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

	return {
		datasetId,
		page,
		pageSize,
		totalRows,
		rows: paginatedRows,
	};
}

export async function getDatasetAnalysis(
	datasetId: string,
): Promise<DatasetAnalysisResponse> {
	const dataset = await getStoredDatasetById(datasetId);
	if (!dataset) {
		throw new HTTPException(404, { message: "Dataset not found" });
	}

	let csvText: string;
	try {
		csvText = await new S3Service().readCsv(dataset.s3ObjectKey);
	} catch (error) {
		const response = storageErrorResponse(error, "read");
		throw new HTTPException(response.status, { message: response.error });
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
	return { datasetId, analysis };
}
