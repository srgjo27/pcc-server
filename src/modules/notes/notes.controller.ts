import { type Request, type Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import { createNoteSchema, noteQuerySchema, updateNoteSchema } from "./notes.schema.js";
import { createNote, deleteNote, getNotes, getNoteById, updateNote } from "./notes.service.js";
import { AppError } from "../../utils/errors.js";

export async function listNotes(req: Request, res: Response): Promise<Response> {
    const query = noteQuerySchema.parse(req.query);

    const { notes, meta } = await getNotes(req.user!.id, query);

    return sendSuccess(
        res,
        notes,
        "Successfully retrieved the note list",
        200,
        meta
    );
}

export async function create(req: Request, res: Response): Promise<Response> {
    const payload = createNoteSchema.parse(req.body);

    const note = await createNote(req.user!.id, payload);

    return sendSuccess(res, note, "Successfully created the note", 201);
}

export async function view(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (typeof id !== "string") {
        throw new AppError(400, "BAD_REQUEST", "Invalid note id");
    }

    const note = await getNoteById(req.user!.id, id);

    return sendSuccess(res, note, "Successfully retrieved the note", 200);
}

export async function update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    
    if (typeof id !== "string") {
        throw new AppError(400, "BAD_REQUEST", "Invalid note id");
    }

    const payload = updateNoteSchema.parse(req.body);

    const note = await updateNote(req.user!.id, id, payload);

    return sendSuccess(res, note, "Successfully updated the note", 200);
}

export async function remove(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (typeof id !== "string") {
        throw new AppError(400, "BAD_REQUEST", "Invalid note id");
    }

    await deleteNote(req.user!.id, id);

    return sendSuccess(res, null, "Successfully deleted the note", 200);
}
