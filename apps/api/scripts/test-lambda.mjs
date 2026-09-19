import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(scriptDirectory, "../.env") });

const { handler } = await import("../dist-lambda/index.js");

const event = {
	version: "2.0",
	routeKey: "GET /health",
	rawPath: "/health",
	rawQueryString: "",
	headers: {},
	requestContext: {
		http: {
			method: "GET",
			path: "/health",
			protocol: "HTTP/1.1",
			sourceIp: "127.0.0.1",
			userAgent: "local-lambda-test",
		},
	},
	isBase64Encoded: false,
};

const response = await handler(event, {}, () => undefined);

assert.equal(response.statusCode, 200, "Expected /health to return HTTP 200");

const body = JSON.parse(response.body ?? "{}");
assert.equal(body.success, true, "Expected success=true in health response");
assert.equal(
	body.service,
	"csv-insight-api",
	"Expected service name in response",
);
assert.equal(body.status, "ok", "Expected status=ok in response");

console.log(JSON.stringify({ statusCode: response.statusCode, body }, null, 2));
