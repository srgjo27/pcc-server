import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/errors.js";
import type { CreateTaskInput, TaskQueryInput } from "./tasks.schema.js";

export async function getTask(userId: string, query: TaskQueryInput) {
    const { page, limit, status } = query;

    const where = {
        userId,
        ...(status !== undefined && { status })
    }

    const [tasks, total] = await Promise.all([
        prisma.task.findMany({
            where,
            select: {
                id: true,
                title: true,
                context: true,
                priority: true,
                status: true,
                dueDate: true,
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit
        }),
        prisma.task.count({ where }),
    ]);

    return {
        tasks,
        meta: {
            total,
            page,
            limit,
            totalPage: Math.ceil(total / limit)
        }
    }
}

export async function createTask(userId: string, payload: CreateTaskInput) {
    const task = await prisma.task.create({
        data: {
            title: payload.title,
            description: payload.description ?? null,
            context: payload.context,
            priority: payload.priority,
            status: payload.status,
            dueDate: payload.dueDate ?? null,
            dueTime: payload.dueTime ?? null,
            tags: payload.tags,
            userId,
        },
    });

    return task;
}

export async function getTaskById(userId: string, taskId: string) {
    const task = await prisma.task.findFirst({
        where: {
            id: taskId, userId
        },
    });

    if (!task) {
        throw new AppError(404, "TASK_NOT_FOUND", "Task not found");
    }

    return task;
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
    const { count } = await prisma.task.deleteMany({
        where: { id: taskId, userId },
    });

    if (count === 0) {
        throw new AppError(404, "TASK_NOT_FOUND", "Task not found");
    }
}