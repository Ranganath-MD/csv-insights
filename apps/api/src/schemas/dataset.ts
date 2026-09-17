import { z } from "zod";

export const datasetIdParamSchema = z.object({
	id: z.string().trim().min(1, "Dataset id is required"),
});

export const datasetRowsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).default(100),
	search: z.string().trim().default(""),
	sortBy: z.string().trim().optional(),
	sortDirection: z.enum(["asc", "desc"]).optional(),
});
