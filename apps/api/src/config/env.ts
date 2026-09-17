import { config } from "dotenv";
import { z } from "zod";

config({ path: new URL("../../.env", import.meta.url) });

const envSchema = z.object({
	NODE_ENV: z
		.enum(["development", "test", "production"])
		.default("development"),
	PORT: z.coerce.number().int().min(1).max(65535).default(4000),
	AWS_REGION: z.string().trim().min(1),
	S3_BUCKET_NAME: z.string().trim().min(1),
	DYNAMODB_TABLE_NAME: z.string().trim().min(1),
	AWS_PROFILE: z.string().trim().optional(),
	CORS_ORIGIN: z.string().trim().default("*"),
});

export type AppEnv = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
