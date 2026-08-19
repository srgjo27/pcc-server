import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/errors.js";
import { HabitFrequency } from "../../../generated/prisma/client.js";
import type { CreateHabitInput, UpdateHabitInput } from "./habits.schema.js";

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

async function seedDefaultHabits(userId: string) {
    const defaultHabits = [
        {
            name: "Gym",
            frequency: HabitFrequency.DAILY,
            targetDays: [0, 1, 2, 3, 4, 5, 6],
            icon: "gym",
            color: "#4ADE80"
        },
        {
            name: "Baca 30 menit",
            frequency: HabitFrequency.DAILY,
            targetDays: [0, 1, 2, 3, 4, 5, 6],
            icon: "book",
            color: "#60A5FA"
        },
        {
            name: "Tidur sebelum jam 12",
            frequency: HabitFrequency.DAILY,
            targetDays: [0, 1, 2, 3, 4, 5, 6],
            icon: "moon",
            color: "#FBBF24"
        },
        {
            name: "Minum air 8 gelas",
            frequency: HabitFrequency.DAILY,
            targetDays: [0, 1, 2, 3, 4, 5, 6],
            icon: "water",
            color: "#22D3EE"
        }
    ];

    await prisma.habit.createMany({
        data: defaultHabits.map(h => ({
            ...h,
            userId
        }))
    });
}

export async function getHabits(userId: string) {
    const count = await prisma.habit.count({
        where: { userId }
    });

    if (count === 0) {
        await seedDefaultHabits(userId);
    }

    const habits = await prisma.habit.findMany({
        where: { userId, isActive: true },
        orderBy: { createdAt: 'asc' }
    });

    return habits;
}

export async function createHabit(userId: string, payload: CreateHabitInput) {
    const habit = await prisma.habit.create({
        data: {
            name: payload.name,
            frequency: payload.frequency,
            targetDays: payload.targetDays,
            icon: payload.icon ?? null,
            color: payload.color ?? null,
            userId
        }
    });
    return habit;
}

export async function updateHabit(userId: string, habitId: string, payload: UpdateHabitInput) {
    const habit = await prisma.habit.findFirst({
        where: { id: habitId, userId }
    });

    if (!habit) {
        throw new AppError(404, "HABIT_NOT_FOUND", "Habit not found");
    }

    const updated = await prisma.habit.update({
        where: { id: habitId },
        data: {
            ...(payload.name !== undefined && { name: payload.name }),
            ...(payload.frequency !== undefined && { frequency: payload.frequency }),
            ...(payload.targetDays !== undefined && { targetDays: payload.targetDays }),
            ...(payload.icon !== undefined && { icon: payload.icon }),
            ...(payload.color !== undefined && { color: payload.color }),
        }
    });

    return updated;
}

export async function deleteHabit(userId: string, habitId: string) {
    const habit = await prisma.habit.findFirst({
        where: { id: habitId, userId }
    });

    if (!habit) {
        throw new AppError(404, "HABIT_NOT_FOUND", "Habit not found");
    }

    const deactivated = await prisma.habit.update({
        where: { id: habitId },
        data: { isActive: false }
    });

    return deactivated;
}

export async function getHabitLogs(userId: string, habitId: string, month?: number, year?: number) {
    const habit = await prisma.habit.findFirst({
        where: { id: habitId, userId }
    });

    if (!habit) {
        throw new AppError(404, "HABIT_NOT_FOUND", "Habit not found");
    }

    const where: any = { habitId };

    if (month && year) {
        const startDate = new Date(Date.UTC(year, month - 1, 1));
        const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
        where.date = {
            gte: startDate,
            lte: endDate
        };
    }

    const logs = await prisma.habitLog.findMany({
        where,
        orderBy: { date: 'desc' }
    });

    return logs;
}

export async function checkInHabit(userId: string, habitId: string, dateStr?: string) {
    const habit = await prisma.habit.findFirst({
        where: { id: habitId, userId, isActive: true }
    });

    if (!habit) {
        throw new AppError(404, "HABIT_NOT_FOUND", "Habit not found or inactive");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true }
    });
    const tz = user?.timezone || "Asia/Jakarta";

    let targetDate: Date;
    if (dateStr) {
        targetDate = new Date(`${dateStr}T00:00:00.000Z`);
    } else {
        const todayStr = getLocalDateString(new Date(), tz);
        targetDate = new Date(`${todayStr}T00:00:00.000Z`);
    }

    const log = await prisma.habitLog.upsert({
        where: {
            habitId_date: {
                habitId,
                date: targetDate
            }
        },
        update: {
            completed: true
        },
        create: {
            habitId,
            date: targetDate,
            completed: true
        }
    });

    return log;
}

export async function cancelCheckIn(userId: string, habitId: string, dateStr: string) {
    const habit = await prisma.habit.findFirst({
        where: { id: habitId, userId }
    });

    if (!habit) {
        throw new AppError(404, "HABIT_NOT_FOUND", "Habit not found");
    }

    const targetDate = new Date(`${dateStr}T00:00:00.000Z`);

    const log = await prisma.habitLog.findUnique({
        where: {
            habitId_date: {
                habitId,
                date: targetDate
            }
        }
    });

    if (!log) {
        throw new AppError(404, "LOG_NOT_FOUND", "Check-in log not found for this date");
    }

    await prisma.habitLog.delete({
        where: {
            habitId_date: {
                habitId,
                date: targetDate
            }
        }
    });

    return { success: true };
}

export async function getStreaks(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true }
    });
    const tz = user?.timezone || "Asia/Jakarta";

    const habits = await prisma.habit.findMany({
        where: { userId, isActive: true },
        include: {
            logs: {
                where: { completed: true },
                orderBy: { date: 'asc' }
            }
        }
    });

    const todayStr = getLocalDateString(new Date(), tz);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday, tz);

    const summaries = habits.map(habit => {
        const completedDates = habit.logs.map(log => getLocalDateString(log.date, tz));
        const uniqueCompletedDates = Array.from(new Set(completedDates)).sort();

        let longestStreak = 0;
        let tempStreak = 0;
        let prevDateStr: string | null = null;

        for (const curDateStr of uniqueCompletedDates) {
            if (prevDateStr === null) {
                tempStreak = 1;
            } else {
                const prevDate = new Date(`${prevDateStr}T00:00:00.000Z`);
                const curDate = new Date(`${curDateStr}T00:00:00.000Z`);
                const diffTime = Math.abs(curDate.getTime() - prevDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    tempStreak += 1;
                } else if (diffDays > 1) {
                    tempStreak = 1;
                }
            }
            if (tempStreak > longestStreak) {
                longestStreak = tempStreak;
            }
            prevDateStr = curDateStr;
        }

        let currentStreak = 0;
        const dateSet = new Set(uniqueCompletedDates);

        if (dateSet.has(todayStr)) {
            let checkDate = new Date(`${todayStr}T00:00:00.000Z`);
            while (dateSet.has(getLocalDateString(checkDate, tz))) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            }
        } else if (dateSet.has(yesterdayStr)) {
            let checkDate = new Date(`${yesterdayStr}T00:00:00.000Z`);
            while (dateSet.has(getLocalDateString(checkDate, tz))) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            }
        }

        return {
            habitId: habit.id,
            name: habit.name,
            icon: habit.icon,
            color: habit.color,
            currentStreak,
            longestStreak,
            totalCompletions: uniqueCompletedDates.length
        };
    });

    return summaries;
}
