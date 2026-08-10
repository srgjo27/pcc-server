import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/errors.js";
import type { CreateNoteInput, NoteQueryInput, UpdateNoteInput } from "./notes.schema.js";

export async function getNotes(userId: string, query: NoteQueryInput) {
    const { page, limit, q, tag } = query;

    const where: any = {
        userId,
    };

    if (tag) {
        where.tags = {
            has: tag
        };
    }

    if (q) {
        where.OR = [
            { title: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } }
        ];
    }

    const [notes, total] = await Promise.all([
        prisma.note.findMany({
            where,
            include: {
                tasks: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                    }
                }
            },
            orderBy: [
                { isPinned: 'desc' },
                { updatedAt: 'desc' }
            ],
            skip: (page - 1) * limit,
            take: limit
        }),
        prisma.note.count({ where }),
    ]);

    return {
        notes,
        meta: {
            total,
            page,
            limit,
            totalPage: Math.ceil(total / limit)
        }
    };
}

export async function createNote(userId: string, payload: CreateNoteInput) {
    const { taskIds, ...noteData } = payload;

    const note = await prisma.note.create({
        data: {
            title: noteData.title,
            content: noteData.content,
            tags: noteData.tags ?? [],
            isPinned: noteData.isPinned ?? false,
            userId,
        },
    });

    if (taskIds && taskIds.length > 0) {
        await prisma.task.updateMany({
            where: {
                id: { in: taskIds },
                userId
            },
            data: {
                noteId: note.id
            }
        });
    }

    return note;
}

export async function getNoteById(userId: string, noteId: string) {
    const note = await prisma.note.findFirst({
        where: { id: noteId, userId },
        include: {
            tasks: {
                select: {
                    id: true,
                    title: true,
                    status: true,
                }
            }
        }
    });

    if (!note) {
        throw new AppError(404, "NOTE_NOT_FOUND", "Note not found");
    }

    return note;
}

export async function updateNote(userId: string, noteId: string, payload: UpdateNoteInput) {
    const note = await prisma.note.findFirst({
        where: { id: noteId, userId }
    });

    if (!note) {
        throw new AppError(404, "NOTE_NOT_FOUND", "Note not found");
    }

    const { taskIds, ...noteData } = payload;

    const updatedNote = await prisma.note.update({
        where: { id: noteId },
        data: {
            ...(noteData.title !== undefined && { title: noteData.title }),
            ...(noteData.content !== undefined && { content: noteData.content }),
            ...(noteData.tags !== undefined && { tags: noteData.tags }),
            ...(noteData.isPinned !== undefined && { isPinned: noteData.isPinned }),
        }
    });

    if (taskIds !== undefined) {
        // Remove associations for tasks previously linked to this note
        await prisma.task.updateMany({
            where: { noteId, userId },
            data: { noteId: null }
        });

        // Link new tasks
        if (taskIds.length > 0) {
            await prisma.task.updateMany({
                where: {
                    id: { in: taskIds },
                    userId
                },
                data: { noteId }
            });
        }
    }

    return updatedNote;
}

export async function deleteNote(userId: string, noteId: string): Promise<void> {
    // Dissociate any linked tasks first to maintain referential integrity safely
    await prisma.task.updateMany({
        where: { noteId, userId },
        data: { noteId: null }
    });

    const { count } = await prisma.note.deleteMany({
        where: { id: noteId, userId }
    });

    if (count === 0) {
        throw new AppError(404, "NOTE_NOT_FOUND", "Note not found");
    }
}
