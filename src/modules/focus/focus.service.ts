import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/errors.js";
import type { CreateFocusSessionInput, FocusSessionQueryInput, FocusStatsQueryInput } from "./focus.schema.js";

function getLocalDateString(date: Date, timezone: string): string {
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });
    const parts = formatter.formatToParts(date);
    const m = parts.find(p => p.type === "month")?.value;
    const d = parts.find(p => p.type === "day")?.value;
    const y = parts.find(p => p.type === "year")?.value;
    return `${y}-${m}-${d}`;
}

export async function createSession(userId: string, payload: CreateFocusSessionInput) {
    if (payload.taskId) {
        const task = await prisma.task.findFirst({
            where: { id: payload.taskId, userId }
        });
        if (!task) {
            throw new AppError(404, "TASK_NOT_FOUND", "Task not found");
        }
    }

    const session = await prisma.focusSession.create({
        data: {
            userId,
            taskId: payload.taskId ?? null,
            durationMins: payload.durationMins,
            plannedMins: payload.plannedMins,
            completedAt: payload.completedAt,
            note: payload.note ?? null,
        }
    });

    return session;
}

export async function getSessions(userId: string, query: FocusSessionQueryInput) {
    const { startDate, endDate, taskId } = query;

    const where: any = { userId };

    if (taskId) {
        where.taskId = taskId;
    }

    if (startDate || endDate) {
        where.completedAt = {};
        if (startDate) {
            where.completedAt.gte = new Date(startDate);
        }
        if (endDate) {
            where.completedAt.lte = new Date(endDate);
        }
    }

    const sessions = await prisma.focusSession.findMany({
        where,
        orderBy: { completedAt: 'desc' }
    });

    return sessions;
}

export async function getStats(userId: string, query: FocusStatsQueryInput) {
    const { startDate, endDate } = query;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true }
    });
    const tz = user?.timezone || "Asia/Jakarta";

    const where: any = { userId };
    if (startDate || endDate) {
        where.completedAt = {};
        if (startDate) {
            where.completedAt.gte = new Date(startDate);
        }
        if (endDate) {
            where.completedAt.lte = new Date(endDate);
        }
    }

    const sessions = await prisma.focusSession.findMany({
        where,
        orderBy: { completedAt: 'asc' }
    });

    let totalMinutes = 0;
    const dailyMap = new Map<string, { sessionsCount: number; totalDurationMins: number }>();

    for (const session of sessions) {
        totalMinutes += session.durationMins;
        const dateStr = getLocalDateString(session.completedAt, tz);
        const existing = dailyMap.get(dateStr) || { sessionsCount: 0, totalDurationMins: 0 };
        existing.sessionsCount += 1;
        existing.totalDurationMins += session.durationMins;
        dailyMap.set(dateStr, existing);
    }

    const totalHours = Number((totalMinutes / 60).toFixed(2));
    const uniqueDays = dailyMap.size;
    const dailyAverageMins = uniqueDays > 0 ? Number((totalMinutes / uniqueDays).toFixed(2)) : 0;

    const dailyStats = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        sessionsCount: data.sessionsCount,
        totalDurationMins: data.totalDurationMins
    })).sort((a, b) => b.date.localeCompare(a.date)); // newest first

    return {
        totalHours,
        totalMinutes,
        totalSessions: sessions.length,
        dailyAverageMins,
        dailyStats
    };
}
