import z from "zod";

export const createEventSchema = z.object({
    title: z.string().min(1, "Title is required").max(100),
    description: z.string().max(1500, "Description maximum 1,500 characters").nullable().optional(),
    context: z.enum(["LECTURE", "WORK", "BUSINESS", "PERSONAL", "GYM"]),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    isRecurring: z.boolean().default(false),
    recurrence: z.object({
        frequency: z.string(),
        days: z.array(z.string()).optional(),
    }).nullable().optional(),
    location: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>

export const queryEventsSchema = z.object({
    startTime: z.coerce.date().optional(),
    endTime: z.coerce.date().optional(),
    context: z.enum(["LECTURE", "WORK", "BUSINESS", "PERSONAL", "GYM"]).optional(),
});

export type EventsQueryInput = z.infer<typeof queryEventsSchema>;

export const updateEventSchema = createEventSchema.partial();

export type UpdateEventInput = z.infer<typeof updateEventSchema>;