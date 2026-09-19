import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(scriptDirectory, "../.env") });

const { handler } = await import("../dist-lambda/index.js");

const event = {
	version: "2.0",
	routeKey: "OPTIONS /datasets",
	rawPath: "/datasets",
	rawQueryString: "",
	headers: {
		origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
		"access-control-request-method": "POST",
		"access-control-request-headers": "content-type",
	},
	requestContext: {
		http: {
			method: "OPTIONS",
			path: "/datasets",
			protocol: "HTTP/1.1",
			sourceIp: "127.0.0.1",
			userAgent: "local-preflight-test",
		},
	},
	isBase64Encoded: false,
};

const response = await handler(event, {}, () => undefined);
assert.equal(response.statusCode, 204, "Expected CORS preflight to return 204");

const headers = response.headers ?? {};
assert.ok(
	headers["access-control-allow-origin"],
	"Expected access-control-allow-origin header",
);
assert.ok(
	headers["access-control-allow-methods"],
	"Expected access-control-allow-methods header",
);

console.log(
	JSON.stringify(
		{
			statusCode: response.statusCode,
			headers: {
				"access-control-allow-origin": headers["access-control-allow-origin"],
				"access-control-allow-methods": headers["access-control-allow-methods"],
				"access-control-allow-headers": headers["access-control-allow-headers"],
			},
		},
		null,
		2,
	),
);
