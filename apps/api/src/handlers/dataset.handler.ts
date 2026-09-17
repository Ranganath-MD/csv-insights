import { HTTPException } from "hono/http-exception";
import {
	getDatasetAnalysis,
	getDatasetDetail,
	getDatasetRows,
	listStoredDatasets,
	toDatasetMetadata,
	uploadDatasetRecord,
} from "../services/dataset.service.js";
import type { AppContext } from "../types/context.js";

export async function listDatasetsHandler(c: AppContext) {
	const allDatasets = await listStoredDatasets();
	return c.json({
		success: true,
		datasets: allDatasets.map((dataset) => toDatasetMetadata(dataset)),
	});
}

export async function uploadDatasetHandler(c: AppContext) {
	const formData = await c.req.formData();
	const fileValue = formData.get("file");
	if (!(fileValue instanceof File)) {
		throw new HTTPException(400, { message: "Missing file field" });
	}

	const payload = await uploadDatasetRecord(fileValue);
	return c.json(payload, 201);
}

export async function getDatasetDetailHandler(c: AppContext) {
	const datasetId = c.req.param("id");
	if (!datasetId) {
		throw new HTTPException(400, { message: "Dataset id is required" });
	}
	const payload = await getDatasetDetail(datasetId);
	return c.json(payload);
}

export async function getDatasetRowsHandler(c: AppContext) {
	const datasetId = c.req.param("id");
	if (!datasetId) {
		throw new HTTPException(400, { message: "Dataset id is required" });
	}
	const page = Math.max(1, Number(c.req.query("page") ?? 1) || 1);
	const pageSize = Math.min(
		100,
		Math.max(1, Number(c.req.query("pageSize") ?? 100) || 100),
	);
	const searchTerm = (c.req.query("search") ?? "").trim().toLowerCase();
	const sortBy = c.req.query("sortBy") ?? "";
	const sortDirection = (
		c.req.query("sortDirection") === "desc" ? "desc" : "asc"
	) as "asc" | "desc";

	const payload = await getDatasetRows(
		datasetId,
		page,
		pageSize,
		searchTerm,
		sortBy,
		sortDirection,
	);
	return c.json(payload);
}

export async function getDatasetAnalysisHandler(c: AppContext) {
	const datasetId = c.req.param("id");
	if (!datasetId) {
		throw new HTTPException(400, { message: "Dataset id is required" });
	}
	const payload = await getDatasetAnalysis(datasetId);
	return c.json(payload);
}
