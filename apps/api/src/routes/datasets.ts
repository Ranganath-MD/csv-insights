import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
	getDatasetAnalysisHandler,
	getDatasetDetailHandler,
	getDatasetRowsHandler,
	listDatasetsHandler,
	uploadDatasetHandler,
} from "../handlers/dataset.handler.js";
import {
	datasetIdParamSchema,
	datasetRowsQuerySchema,
} from "../schemas/dataset.js";

const datasetRoutes = new Hono();

datasetRoutes.get("/", listDatasetsHandler);
datasetRoutes.post("/", uploadDatasetHandler);
datasetRoutes.get(
	"/:id",
	zValidator("param", datasetIdParamSchema),
	getDatasetDetailHandler,
);
datasetRoutes.get(
	"/:id/rows",
	zValidator("param", datasetIdParamSchema),
	zValidator("query", datasetRowsQuerySchema),
	getDatasetRowsHandler,
);
datasetRoutes.get(
	"/:id/analysis",
	zValidator("param", datasetIdParamSchema),
	getDatasetAnalysisHandler,
);

export { datasetRoutes };
