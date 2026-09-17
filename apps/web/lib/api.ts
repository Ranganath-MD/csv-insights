import type {
	DatasetAnalysisResponse,
	DatasetDetailResponse,
	DatasetRowsQuery,
	DatasetRowsResponse,
	ListDatasetsResponse,
	UploadDatasetResponse,
} from "@csv-insight/types";

const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

function buildApiUrl(path: string): string {
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	return API_BASE_URL + normalizedPath;
}

async function parseJsonResponse<T>(
	response: Response,
	fallbackMessage: string,
): Promise<T> {
	if (!response.ok) {
		const payload = (await response
			.json()
			.catch(() => ({ error: fallbackMessage }))) as { error?: string };

		throw new Error(payload.error ?? fallbackMessage);
	}

	return (await response.json()) as T;
}

export async function listDatasets(): Promise<ListDatasetsResponse> {
	const response = await fetch(buildApiUrl("/datasets"), {
		cache: "no-store",
	});

	return parseJsonResponse<ListDatasetsResponse>(
		response,
		"Failed to fetch datasets",
	);
}

export async function getDataset(
	datasetId: string,
): Promise<DatasetDetailResponse> {
	const response = await fetch(buildApiUrl(`/datasets/${datasetId}`), {
		cache: "no-store",
	});

	return parseJsonResponse<DatasetDetailResponse>(
		response,
		"Unable to load dataset",
	);
}

export async function getDatasetRows(
	datasetId: string,
	options: Partial<DatasetRowsQuery> = {},
): Promise<DatasetRowsResponse> {
	const params = new URLSearchParams();
	if (options.page) {
		params.set("page", String(options.page));
	}
	if (options.pageSize) {
		params.set("pageSize", String(options.pageSize));
	}
	if (options.search) {
		params.set("search", options.search);
	}
	if (options.sortBy) {
		params.set("sortBy", options.sortBy);
	}
	if (options.sortDirection) {
		params.set("sortDirection", options.sortDirection);
	}

	const queryString = params.toString();
	const url = buildApiUrl(
		`/datasets/${datasetId}/rows${queryString ? `?${queryString}` : ""}`,
	);
	const response = await fetch(url, {
		cache: "no-store",
	});

	return parseJsonResponse<DatasetRowsResponse>(
		response,
		"Failed to fetch dataset rows",
	);
}

export async function getDatasetAnalysis(
	datasetId: string,
): Promise<DatasetAnalysisResponse> {
	const response = await fetch(buildApiUrl(`/datasets/${datasetId}/analysis`), {
		cache: "no-store",
	});

	return parseJsonResponse<DatasetAnalysisResponse>(
		response,
		"Unable to load dataset analysis",
	);
}

export async function uploadDataset(
	file: File,
): Promise<UploadDatasetResponse> {
	const formData = new FormData();
	formData.append("file", file);

	const response = await fetch(buildApiUrl("/datasets"), {
		method: "POST",
		body: formData,
	});

	return parseJsonResponse<UploadDatasetResponse>(response, "Upload failed");
}
