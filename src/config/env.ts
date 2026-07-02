import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    DIRECT_URL: z.string().min(1, "DIRECT_URL is required"),
    SUPABASE_URL: z.string().min(1, "SUPABASE_URL is required"),
    SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
    CORS_ORIGIN: z.string().default("*"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.data) {
    process.exit(1);
}

export const env = parsed.data;