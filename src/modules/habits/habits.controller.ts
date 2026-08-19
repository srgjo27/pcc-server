import { type Request, type Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import { AppError } from "../../utils/errors.js";
import {
    createHabitSchema,
    updateHabitSchema,
    habitLogsQuerySchema
} from "./habits.schema.js";
import {
    getHabits,
    createHabit,
    updateHabit,
    deleteHabit,
    getHabitLogs,
    checkInHabit,
    cancelCheckIn,
    getStreaks
} from "./habits.service.js";

export async function listHabits(req: Request, res: Response): Promise<Response> {
    const habits = await getHabits(req.user!.id);
    return sendSuccess(res, habits, "Successfully retrieved habits list", 200);
}

export async function create(req: Request, res: Response): Promise<Response> {
    const payload = createHabitSchema.parse(req.body);
    const habit = await createHabit(req.user!.id, payload);
    return sendSuccess(res, habit, "Successfully created a new habit", 201);
}

export async function update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (typeof id !== "string") {
        throw new AppError(400, "BAD_REQUEST", "Invalid habit id");
    }
    const payload = updateHabitSchema.parse(req.body);
    const habit = await updateHabit(req.user!.id, id, payload);
    return sendSuccess(res, habit, "Successfully updated the habit", 200);
}

export async function remove(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (typeof id !== "string") {
        throw new AppError(400, "BAD_REQUEST", "Invalid habit id");
    }
    const habit = await deleteHabit(req.user!.id, id);
    return sendSuccess(res, habit, "Successfully deactivated the habit", 200);
}

export async function listLogs(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (typeof id !== "string") {
        throw new AppError(400, "BAD_REQUEST", "Invalid habit id");
    }
    const query = habitLogsQuerySchema.parse(req.query);
    const logs = await getHabitLogs(req.user!.id, id, query.month, query.year);
    return sendSuccess(res, logs, "Successfully retrieved habit log history", 200);
}

export async function checkIn(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (typeof id !== "string") {
        throw new AppError(400, "BAD_REQUEST", "Invalid habit id");
    }
    const { date } = req.body;
    if (date && typeof date !== "string") {
        throw new AppError(400, "BAD_REQUEST", "Invalid date format");
    }
    const log = await checkInHabit(req.user!.id, id, date);
    return sendSuccess(res, log, "Successfully checked in habit", 200);
}

export async function removeCheckIn(req: Request, res: Response): Promise<Response> {
    const { id, date } = req.params;
    if (typeof id !== "string" || typeof date !== "string") {
        throw new AppError(400, "BAD_REQUEST", "Invalid arguments");
    }
    const result = await cancelCheckIn(req.user!.id, id, date);
    return sendSuccess(res, result, "Successfully cancelled check-in log", 200);
}

export async function streakSummary(req: Request, res: Response): Promise<Response> {
    const summary = await getStreaks(req.user!.id);
    return sendSuccess(res, summary, "Successfully retrieved streak summary", 200);
}
