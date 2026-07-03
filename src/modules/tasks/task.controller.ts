import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import { taskQuerySchema } from "./tasks.schema.js";
import { getTask } from "./task.service.js";

export async function tasks(req: Request, res: Response): Promise<Response> {
    const query = taskQuerySchema.parse(req.query);

    const { tasks, meta } = await getTask(req.user!.id, query);

    return sendSuccess(
        res,
        tasks,
        "Successfully retrieved the task list",
        200,
        meta
    );
}