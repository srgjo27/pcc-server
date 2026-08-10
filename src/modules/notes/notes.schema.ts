import z from "zod";

export const baseNoteSchema = z.object({
    userId: z.string().uuid("Invalid user ID"),
    title: z.string().min(1, "Title is required").max(255, "Title: maximum 255 characters"),
    content: z.string(), // Markdown / rich text (JSON Tiptap)
    tags: z.array(z.string()).default([]),
    isPinned: z.boolean().default(false),
});

export const noteSchema = baseNoteSchema.extend({
    id: z.string().uuid().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
});

export const createNoteSchema = noteSchema.omit({
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
}).extend({
    taskIds: z.array(z.string().uuid()).optional(),
});

export const updateNoteSchema = createNoteSchema.partial();

export const noteQuerySchema = z.object({
    q: z.string().optional(),
    tag: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type BaseNote = z.infer<typeof baseNoteSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type NoteQueryInput = z.infer<typeof noteQuerySchema>;

