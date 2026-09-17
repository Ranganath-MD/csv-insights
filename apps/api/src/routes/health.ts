import { Hono } from "hono";
import type { AppContext } from "../types/context.js";

const healthRoutes = new Hono();

healthRoutes.get("/health", (c: AppContext) => {
	return c.json({
		success: true,
		service: "csv-insight-api",
		status: "ok",
		requestId: c.get("requestId"),
	});
});

export { healthRoutes };
