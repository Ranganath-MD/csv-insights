import { serve } from "@hono/node-server";
import { config } from "dotenv";

config({ path: new URL("../.env", import.meta.url) });

const { app } = await import("./app.js");

const port = Number(process.env.PORT ?? 4000);

serve({ fetch: app.fetch, port }, () => {
	console.log(`API listening on http://localhost:${port}`);
});
