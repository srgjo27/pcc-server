import z from "zod";
import { HabitFrequency } from "../../../generated/prisma/client.js";

export const createHabitSchema = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name too long"),
    icon: z.string().optional().nullable(),
    frequency: z.nativeEnum(HabitFrequency).default(HabitFrequency.DAILY),
    targetDays: z.array(z.number().min(0).max(6)).default([]),
    color: z.string().optional().nullable(),
});

export const updateHabitSchema = createHabitSchema.partial();

export const habitLogsQuerySchema = z.object({
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(1900).max(2100).optional(),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type HabitLogsQueryInput = z.infer<typeof habitLogsQuerySchema>;
