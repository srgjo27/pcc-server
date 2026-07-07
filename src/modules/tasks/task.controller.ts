import { type Request, type Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import { createTaskSchema, taskQuerySchema } from "./tasks.schema.js";
import { createTask, deleteTask, getTask, getTaskById } from "./task.service.js";
import { AppError } from "../../utils/errors.js";

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

export async function create(req: Request, res: Response): Promise<Response> {
    const payload = createTaskSchema.parse(req.body);

    const task = await createTask(req.user!.id, payload);;

    return sendSuccess(res, task, "Successfully created the task", 201);
}

export async function view(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (typeof id !== "string") {
        throw new AppError(400, "BAD_REQUEST", "Invalid task id");
    }

    const task = await getTaskById(req.user!.id, id);

    return sendSuccess(res, task, "Successfully retrieved the task", 200);
}

export async function remove(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (typeof id !== "string") {
        throw new AppError(400, "BAD_REQUEST", "Invalid task id");
    }

    await deleteTask(req.user!.id, id);

    return sendSuccess(res, null, "Successfully deleted the task", 200);
}