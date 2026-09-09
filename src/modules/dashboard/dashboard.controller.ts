import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import {
    getDailyOverview,
    quickAddTask,
    quickAddNote,
} from "./dashboard.service.js";
import {
    quickAddSchema,
    quickAddTaskSchema,
    quickAddNoteSchema,
} from "./dashboard.schema.js";

export async function dailyOverview(req: Request, res: Response): Promise<Response> {
    const data = await getDailyOverview(req.user!.id);
    return sendSuccess(res, data, "Successfully retrieved daily dashboard overview", 200);
}

export async function handleQuickAddTask(req: Request, res: Response): Promise<Response> {
    const payload = quickAddTaskSchema.parse(req.body);
    const result = await quickAddTask(req.user!.id, payload);
    return sendSuccess(res, result, "Successfully created task via quick-add", 201);
}

export async function handleQuickAddNote(req: Request, res: Response): Promise<Response> {
    const payload = quickAddNoteSchema.parse(req.body);
    const result = await quickAddNote(req.user!.id, payload);
    return sendSuccess(res, result, "Successfully created note via quick-add", 201);
}
