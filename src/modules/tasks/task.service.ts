import { prisma } from "../../config/prisma.js";
import type { TaskQueryInput } from "./tasks.schema.js";

export async function getTask(userId: string, query: TaskQueryInput) {
    const { page, limit, status } = query;

    const where = {
        userId,
        ...(status !== undefined && { status })
    }

    const [tasks, total] = await Promise.all([
        prisma.task.findMany({
            where,
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