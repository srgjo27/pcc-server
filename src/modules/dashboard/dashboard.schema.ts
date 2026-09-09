import z from "zod";
import { createTaskSchema } from "../tasks/tasks.schema.js";
import { createNoteSchema } from "../notes/notes.schema.js";

export const quickAddTaskSchema = createTaskSchema;
export const quickAddNoteSchema = createNoteSchema;

export const quickAddSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("TASK"),
        data: createTaskSchema,
    }),
    z.object({
        type: z.literal("NOTE"),
        data: createNoteSchema,
    }),
]);

export type QuickAddInput = z.infer<typeof quickAddSchema>;
