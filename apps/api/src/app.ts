import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { env } from "./config/env.js";
import { datasetRoutes } from "./routes/datasets.js";
import { healthRoutes } from "./routes/health.js";
import type { AppVariables } from "./types/context.js";

const app = new Hono<{ Variables: AppVariables }>();

app.use("*", async (c, next) => {
	const requestId = c.req.header("x-request-id") ?? randomUUID();
	c.set("requestId", requestId);
	c.header("x-request-id", requestId);
	await next();
});

app.use("*", logger());
app.use(
	"*",
	cors({
		origin: env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN,
		allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization", "x-request-id"],
		credentials: true,
	}),
);
app.use(
	"*",
	secureHeaders({
		crossOriginResourcePolicy: "cross-origin",
	}),
);

app.route("/", healthRoutes);
app.route("/datasets", datasetRoutes);

app.onError((error, c) => {
	const requestId = c.get("requestId");
	const isHttpError = error instanceof HTTPException;
	const status = isHttpError ? error.status : 500;
	const code = isHttpError ? "HTTP_EXCEPTION" : "INTERNAL_SERVER_ERROR";
	const message = isHttpError ? error.message : "An unexpected error occurred.";

	console.error("api-error", {
		requestId,
		status,
		code,
		message,
	});

	return c.json(
		{
			success: false,
			error: {
				code,
				message,
			},
		},
		status,
	);
});

app.notFound((c) => {
	return c.json(
		{
			success: false,
			error: {
				code: "NOT_FOUND",
				message: "The requested resource was not found.",
			},
		},
		404,
	);
});

export { app };
