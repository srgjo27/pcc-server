import { prisma, Prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/errors.js";
import type { CreateEventInput, EventsQueryInput } from "./schedule.schema.js";

export async function getEvents(userId: string, query: EventsQueryInput) {
    const { startTime, endTime, context } = query;

    const where: Prisma.EventWhereInput = {
        userId,
    };

    if (context) {
        where.context = context;
    }

    if (startTime) {
        where.startTime = { gte: startTime };
    }

    if (endTime) {
        where.endTime = { lte: endTime };
    }

    const [events] = await Promise.all([
        prisma.event.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        }),
    ]);

    return { events };
}

export async function createEvent(userId: string, payload: CreateEventInput) {
    const event = await prisma.event.create({
        data: {
            title: payload.title,
            description: payload.description ?? null,
            context: payload.context,
            startTime: payload.startTime,
            endTime: payload.endTime,
            isRecurring: payload.isRecurring,
            recurrence: payload.recurrence ?? {},
            location: payload.location ?? null,
            color: payload.color ?? null,
            userId,
        }
    });

    return event;
}

export async function getEventById(userId: string, eventId: string) {
    const event = await prisma.event.findFirst({
        where: {
            id: eventId, userId
        }
    });

    if (!event) {
        throw new AppError(404, "EVENT_NOT_FOUND", "Event not found");
    }

    return event;
}

export async function deleteEvent(userId: string, eventId: string): Promise<void> {
    const { count } = await prisma.event.deleteMany({
        where: { id: eventId, userId }
    });

    if (count === 0) {
        throw new AppError(404, "TASK_NOT_FOUND", "Task not found");
    }
}