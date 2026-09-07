import z from "zod";

export const createFocusSessionSchema = z.object({
    taskId: z.string().uuid("Invalid task ID format").nullable().optional(),
    durationMins: z.coerce.number().int().min(1, "Duration must be at least 1 minute"),
    plannedMins: z.coerce.number().int().min(1, "Planned duration must be at least 1 minute").default(25),
    completedAt: z.coerce.date().default(() => new Date()),
    note: z.string().max(1000, "Note: maximum 1,000 characters").nullable().optional(),
});

export type CreateFocusSessionInput = z.infer<typeof createFocusSessionSchema>;

export const focusSessionQuerySchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    taskId: z.string().uuid("Invalid task ID format").optional(),
});

export type FocusSessionQueryInput = z.infer<typeof focusSessionQuerySchema>;

export const focusStatsQuerySchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export type FocusStatsQueryInput = z.infer<typeof focusStatsQuerySchema>;
