import type {
	ColumnSummary,
	DatasetAnalysisSummary,
	DatasetCellValue,
	DatasetRow,
	DetectedDataType,
} from "@csv-insight/types";

export interface CsvAnalyzer {
	analyze(csvText: string): Promise<DatasetAnalysisSummary>;
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

function detectColumnType(values: DatasetCellValue[]): DetectedDataType {
	const nonNullValues = values.filter(
		(value): value is Exclude<DatasetCellValue, null> => value !== null,
	);

	if (nonNullValues.length === 0) {
		return "unknown";
	}

	if (nonNullValues.every((value) => typeof value === "number")) {
		return "number";
	}

	if (nonNullValues.every((value) => typeof value === "boolean")) {
		return "boolean";
	}

	if (
		nonNullValues.every((value) => {
			if (typeof value !== "string") {
				return false;
			}
			const normalized = value.trim();
			return normalized.length > 0 && !Number.isNaN(Date.parse(normalized));
		})
	) {
		return "date";
	}

	return "string";
}

function summarizeColumn(
	columnName: string,
	columnValues: DatasetCellValue[],
): ColumnSummary {
	const missingValues = columnValues.filter(
		(value) =>
			value === null ||
			(typeof value === "string" && value.trim().length === 0),
	).length;

	return {
		columnName,
		detectedType: detectColumnType(columnValues),
		missingValues,
	};
}

export async function analyzeCsv(
	csvText: string,
): Promise<DatasetAnalysisSummary> {
	const rows = parseCsvRows(csvText);

	if (rows.length === 0) {
		return {
			dataset: {
				rowCount: 0,
				columnCount: 0,
				fileSizeBytes: new TextEncoder().encode(csvText).length,
				missingValueCount: 0,
				duplicateRowCount: 0,
			},
			columns: [],
		};
	}

	const columnNames = Object.keys(rows[0] ?? {});
	const columnValues = columnNames.map((columnName) =>
		rows.map((row) => row[columnName] ?? null),
	);

	const duplicateRowCount = (() => {
		const seen = new Map<string, number>();
		let duplicates = 0;
		for (const row of rows) {
			const rowKey = JSON.stringify(row);
			const previousCount = seen.get(rowKey) ?? 0;
			seen.set(rowKey, previousCount + 1);
			if (previousCount > 0) {
				duplicates += 1;
			}
		}
		return duplicates;
	})();

	const columns = columnNames.map((columnName, index) =>
		summarizeColumn(columnName, columnValues[index] ?? []),
	);

	const missingValueCount = columns.reduce(
		(total, column) => total + column.missingValues,
		0,
	);

	return {
		dataset: {
			rowCount: rows.length,
			columnCount: columnNames.length,
			fileSizeBytes: new TextEncoder().encode(csvText).length,
			missingValueCount,
			duplicateRowCount,
		},
		columns,
	};
}

export function createPlaceholderAnalysis(): DatasetAnalysisSummary {
	return {
		dataset: {
			rowCount: 0,
			columnCount: 0,
			fileSizeBytes: 0,
			missingValueCount: 0,
			duplicateRowCount: 0,
		},
		columns: [],
	};
}
