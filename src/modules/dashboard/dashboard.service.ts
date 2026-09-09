import { prisma } from "../../config/prisma.js";
import { createTask } from "../tasks/task.service.js";
import { createNote } from "../notes/notes.service.js";
import { getStreaks } from "../habits/habits.service.js";
import type { CreateTaskInput } from "../tasks/tasks.schema.js";
import type { CreateNoteInput } from "../notes/notes.schema.js";

function getLocalDateParts(date: Date, timezone: string): {
    year: number;
    month: number; 
    day: number;
    dayOfWeek: number; 
    dateString: string; 
} {
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "narrow",
    });

    const parts = formatter.formatToParts(date);
    const year = Number(parts.find((p) => p.type === "year")?.value);
    const month = Number(parts.find((p) => p.type === "month")?.value);
    const day = Number(parts.find((p) => p.type === "day")?.value);

    const dayOfWeekFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        weekday: "short",
    });
    const weekdayStr = dayOfWeekFormatter.format(date);
    const weekdays: Record<string, number> = {
        Sun: 0,
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
    };
    const dayOfWeek = weekdays[weekdayStr] ?? 0;

    const pad = (n: number) => String(n).padStart(2, "0");
    const dateString = `${year}-${pad(month)}-${pad(day)}`;

    return { year, month, day, dayOfWeek, dateString };
}

function getLocalDateString(date: Date, timezone: string): string {
    const { dateString } = getLocalDateParts(date, timezone);
    return dateString;
}

export async function getDailyOverview(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true, name: true, email: true },
    });
    const tz = user?.timezone || "Asia/Jakarta";
    const now = new Date();
    const { year, month, dayOfWeek, dateString } = getLocalDateParts(now, tz);

    const urgentTasksPromise = prisma.task.findMany({
        where: {
            userId,
            priority: "URGENT",
            status: {
                notIn: ["DONE", "CANCELLED"],
            },
        },
        orderBy: [
            { dueDate: "asc" },
            { createdAt: "desc" },
        ],
    });

    const startOfDay = new Date(`${dateString}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateString}T23:59:59.999Z`);

    const todayEventsPromise = prisma.event.findMany({
        where: {
            userId,
            OR: [
                {
                    startTime: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
                {
                    startTime: { lte: endOfDay },
                    endTime: { gte: startOfDay },
                },
            ],
        },
        orderBy: {
            startTime: "asc",
        },
    });

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const monthlyTransactionsPromise = prisma.transaction.findMany({
        where: {
            userId,
            date: {
                gte: startOfMonth,
                lte: endOfMonth,
            },
        },
    });

    const habitsPromise = prisma.habit.findMany({
        where: {
            userId,
            isActive: true,
        },
        include: {
            logs: {
                where: {
                    completed: true,
                },
                orderBy: {
                    date: "asc",
                },
            },
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    const [urgentTasks, todayEvents, monthlyTransactions, habits, rawStreaks] = await Promise.all([
        urgentTasksPromise,
        todayEventsPromise,
        monthlyTransactionsPromise,
        habitsPromise,
        getStreaks(userId),
    ]);

    let totalIncome = 0;
    let totalExpense = 0;

    monthlyTransactions.forEach((t) => {
        const amount = Number(t.amount);
        if (t.type === "INCOME") {
            totalIncome += amount;
        } else if (t.type === "EXPENSE") {
            totalExpense += amount;
        }
    });

    const netBalance = totalIncome - totalExpense;

    const streaksMap = new Map(rawStreaks.map((s) => [s.habitId, s]));

    const habitSnapshots = habits.map((habit) => {
        const completedDates = habit.logs.map((log) => getLocalDateString(log.date, tz));
        const isCompletedToday = completedDates.includes(dateString);
        const isScheduledToday =
            habit.targetDays.length === 0 || habit.targetDays.includes(dayOfWeek);

        const streakInfo = streaksMap.get(habit.id);

        return {
            id: habit.id,
            name: habit.name,
            icon: habit.icon,
            color: habit.color,
            frequency: habit.frequency,
            targetDays: habit.targetDays,
            isScheduledToday,
            isCompletedToday,
            currentStreak: streakInfo?.currentStreak ?? 0,
            longestStreak: streakInfo?.longestStreak ?? 0,
            totalCompletions: streakInfo?.totalCompletions ?? 0,
        };
    });

    const todayScheduledHabits = habitSnapshots.filter((h) => h.isScheduledToday);
    const uncompletedHabits = todayScheduledHabits.filter((h) => !h.isCompletedToday);
    const completedHabitsCount = todayScheduledHabits.filter((h) => h.isCompletedToday).length;

    const streakSnapshot = {
        habits: habitSnapshots,
        summary: {
            totalActiveHabits: habits.length,
            scheduledTodayCount: todayScheduledHabits.length,
            completedTodayCount: completedHabitsCount,
            uncompletedTodayCount: uncompletedHabits.length,
            bestCurrentStreak: Math.max(0, ...habitSnapshots.map((h) => h.currentStreak)),
        },
    };

    return {
        today: {
            date: dateString,
            timezone: tz,
            dayOfWeek,
        },
        dailyBriefing: {
            urgentTasks: {
                total: urgentTasks.length,
                items: urgentTasks,
            },
            todayEvents: {
                total: todayEvents.length,
                items: todayEvents,
            },
            monthlyBalance: {
                month,
                year,
                totalIncome,
                totalExpense,
                netBalance,
            },
            uncompletedHabits: {
                total: uncompletedHabits.length,
                items: uncompletedHabits,
            },
        },
        streakSnapshot,
    };
}

export async function quickAddTask(userId: string, payload: CreateTaskInput) {
    return createTask(userId, payload);
}

export async function quickAddNote(userId: string, payload: CreateNoteInput) {
    return createNote(userId, payload);
}
