import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { createPlaceholderAnalysis } from "@csv-insight/analyzer";
import type {
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

const port = Number(process.env.PORT ?? 4000);
const app = new Hono();
const dataDirectory = join(process.cwd(), "data", "datasets");

type StoredDataset = DatasetMetadata & {
	absFilePath: string;
};

const datasets = new Map<string, StoredDataset>();

const dataDirectoryReady = mkdir(dataDirectory, { recursive: true });

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
		},
	});
});

app.post("/datasets", async (c) => {
	await dataDirectoryReady;

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

	const fileExtension = extname(fileValue.name) || ".csv";
	const datasetId = randomUUID();
	const storedFileName = `${datasetId}${fileExtension}`;
	const absFilePath = join(dataDirectory, storedFileName);
	const fileBuffer = Buffer.from(await fileValue.arrayBuffer());
	const csvText = fileBuffer.toString("utf8");
	const csvShape = getBasicCsvShape(csvText);

	await writeFile(absFilePath, fileBuffer);

	const dataset: StoredDataset = {
		id: datasetId,
		originalFileName: fileValue.name,
		uploadedAt: new Date().toISOString(),
		fileSizeBytes: fileValue.size,
		rowCount: csvShape.rowCount,
		columnCount: csvShape.columnCount,
		absFilePath,
	};

	datasets.set(datasetId, dataset);

	const payload: UploadDatasetResponse = {
		dataset: toDatasetMetadata(dataset),
	};

	return c.json(payload, 201);
});

app.get("/datasets", (c) => {
	const allDatasets = Array.from(datasets.values())
		.map((dataset) => toDatasetMetadata(dataset))
		.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

	const payload: ListDatasetsResponse = {
		datasets: allDatasets,
	};

	return c.json(payload);
});

app.get("/datasets/:id", (c) => {
	const datasetId = c.req.param("id");
	const dataset = datasets.get(datasetId);

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
	const dataset = datasets.get(datasetId);

	if (!dataset) {
		return c.json({ error: "Dataset not found" }, 404);
	}

	const csvText = await readFile(dataset.absFilePath, "utf8");
	const rows = parseCsvRows(csvText);
	const payload: DatasetRowsResponse = {
		datasetId,
		page: 1,
		pageSize: rows.length,
		totalRows: rows.length,
		rows,
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
