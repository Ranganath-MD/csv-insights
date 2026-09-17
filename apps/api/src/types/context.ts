import type { Context as HonoContext } from "hono";

export type AppVariables = {
	requestId: string;
};

export type AppContext = HonoContext<{ Variables: AppVariables }>;
