import { type Request, type Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import { createFocusSessionSchema, focusSessionQuerySchema, focusStatsQuerySchema } from "./focus.schema.js";
import { createSession, getSessions, getStats } from "./focus.service.js";

export async function createFocusSession(req: Request, res: Response): Promise<Response> {
    const payload = createFocusSessionSchema.parse(req.body);
    const session = await createSession(req.user!.id, payload);
    return sendSuccess(res, session, "Successfully saved focus session", 201);
}

export async function listFocusSessions(req: Request, res: Response): Promise<Response> {
    const query = focusSessionQuerySchema.parse(req.query);
    const sessions = await getSessions(req.user!.id, query);
    return sendSuccess(res, sessions, "Successfully retrieved focus sessions history", 200);
}

export async function getFocusStats(req: Request, res: Response): Promise<Response> {
    const query = focusStatsQuerySchema.parse(req.query);
    const stats = await getStats(req.user!.id, query);
    return sendSuccess(res, stats, "Successfully retrieved focus statistics", 200);
}
