import z from "zod";

export const registerSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .max(72, "Password must be no more than 72 characters long"),
    name: z.string().trim().min(1).max(100).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>

export const verifyEmailSchema = z.object({
    token_hash: z.string().min(1, "token_hash is required"),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>

export const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .max(72, "Password must be no more than 72 characters long"),
});

export type LoginInput = z.infer<typeof loginSchema>