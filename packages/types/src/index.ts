export type DetectedDataType =
	| "string"
	| "number"
	| "boolean"
	| "date"
	| "unknown";

export interface DatasetSummary {
	rowCount: number;
	columnCount: number;
	fileSizeBytes: number;
	missingValueCount: number;
	duplicateRowCount: number;
}

export interface ColumnSummary {
	columnName: string;
	detectedType: DetectedDataType;
	missingValues: number;
}

export interface DatasetAnalysisSummary {
	dataset: DatasetSummary;
	columns: ColumnSummary[];
}

export type DatasetCellValue = string | number | boolean | null;

export type DatasetRow = Record<string, DatasetCellValue>;

export interface DatasetMetadata {
	id: string;
	originalFileName: string;
	uploadedAt: string;
	fileSizeBytes: number;
	rowCount: number;
	columnCount: number;
}

export interface UploadDatasetResponse {
	dataset: DatasetMetadata;
}

export interface ListDatasetsResponse {
	datasets: DatasetMetadata[];
}

export interface DatasetDetailResponse {
	dataset: DatasetMetadata;
}

export type SortDirection = "asc" | "desc";

export interface DatasetRowsQuery {
	page: number;
	pageSize: number;
	search?: string;
	sortBy?: string;
	sortDirection?: SortDirection;
	filters?: Record<string, string>;
}

export interface DatasetRowsResponse {
	datasetId: string;
	page: number;
	pageSize: number;
	totalRows: number;
	rows: DatasetRow[];
}

export interface DatasetAnalysisResponse {
	datasetId: string;
	analysis: DatasetAnalysisSummary;
}
