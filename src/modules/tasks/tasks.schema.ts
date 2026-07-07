import z from "zod";

export const taskQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
});

export type TaskQueryInput = z.infer<typeof taskQuerySchema>;

export const createTaskSchema = z.object({
    title: z.string().min(1, "Title is required").max(100),
    description: z.string().max(1500, "Description: maximum 1,500 characters").nullable().optional(),
    context: z.enum(["LECTURE", "WORK", "BUSINESS", "PERSONAL"]),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]),
    dueDate: z.coerce.date().nullable().optional(),
    dueTime: z.string().nullable().optional(),
    tags: z.array(z.string()).default([]),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;