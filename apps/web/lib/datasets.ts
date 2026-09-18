import type {
	DatasetAnalysisSummary,
	DatasetMetadata,
	DatasetRow,
} from "@csv-insight/types";

import { getDataset, getDatasetAnalysis, getDatasetRows } from "@/lib/api";

export const DATASET_TABLE_PAGE_SIZE = 100;

export type SortDirection = "asc" | "desc";

export type DatasetTableQuery = {
	page?: string;
	search?: string;
	sortBy?: string;
	sortDirection?: string;
};

export function normalizeDatasetTableQuery(searchParams: DatasetTableQuery): {
	page: number;
	search: string;
	sortBy: string;
	sortDirection: SortDirection;
} {
	const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);
	const search = searchParams.search?.trim() ?? "";
	const sortBy = searchParams.sortBy?.trim() ?? "";
	const sortDirection: SortDirection =
		searchParams.sortDirection === "desc" ? "desc" : "asc";

	return { page, search, sortBy, sortDirection };
}

export async function getDatasetTablePageData(
	datasetId: string,
	searchParams: DatasetTableQuery,
): Promise<{
	dataset: DatasetMetadata | null;
	analysis: DatasetAnalysisSummary | null;
	rows: DatasetRow[];
	totalRows: number;
	totalPages: number;
	columns: string[];
	page: number;
	search: string;
	sortBy: string;
	sortDirection: SortDirection;
}> {
	const { page, search, sortBy, sortDirection } =
		normalizeDatasetTableQuery(searchParams);

	const [datasetPayload, rowsPayload, analysisPayload] = await Promise.all([
		getDataset(datasetId).catch(
			() => ({ dataset: null } as { dataset: DatasetMetadata | null }),
		),
		getDatasetRows(datasetId, {
			page,
			pageSize: DATASET_TABLE_PAGE_SIZE,
			search,
			sortBy,
			sortDirection,
		}).catch(
			() => ({ rows: [], totalRows: 0 } as { rows: DatasetRow[]; totalRows: number }),
		),
		getDatasetAnalysis(datasetId).catch(() => null),
	]);

	const dataset: DatasetMetadata | null = datasetPayload.dataset ?? null;
	const analysis = analysisPayload?.analysis ?? null;
	const rows: DatasetRow[] = rowsPayload.rows ?? [];
	const totalRows = rowsPayload.totalRows ?? 0;
	const totalPages = Math.max(
		1,
		Math.ceil(totalRows / DATASET_TABLE_PAGE_SIZE),
	);
	const columns =
		rows.length > 0
			? Object.keys(rows[0] ?? {})
			: Array.from(
					{ length: dataset?.columnCount ?? 0 },
					(_, index) => `Column ${index + 1}`,
				);

	return {
		dataset,
		analysis,
		rows,
		totalRows,
		totalPages,
		columns,
		page,
		search,
		sortBy,
		sortDirection,
	};
}

export function buildDatasetTableHref(
	datasetId: string,
	values: {
		page: number;
		search: string;
		sortBy: string;
		sortDirection: SortDirection;
	},
): string {
	const query = new URLSearchParams({ page: String(values.page) });
	if (values.search) query.set("search", values.search);
	if (values.sortBy) query.set("sortBy", values.sortBy);
	if (values.sortDirection === "desc") {
		query.set("sortDirection", values.sortDirection);
	}
	return `/datasets/${datasetId}/table?${query}`;
}
