import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/errors.js";
import type {
    CreateTransactionInput,
    UpdateTransactionInput,
    CreateFinanceBudgetInput,
} from "./finance.schema.js";

export async function createTransaction(userId: string, payload: CreateTransactionInput) {
    const transaction = await prisma.transaction.create({
        data: {
            userId,
            type: payload.type,
            context: payload.context,
            amount: payload.amount,
            category: payload.category,
            description: payload.description ?? null,
            date: payload.date,
        },
    });
    return {
        ...transaction,
        amount: Number(transaction.amount),
    };
}

export async function getTransactions(userId: string, query: { type?: "INCOME" | "EXPENSE"; category?: string; page?: number; limit?: number } = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where = {
        userId,
        ...(query.type && { type: query.type }),
        ...(query.category && { category: { equals: query.category, mode: "insensitive" as const } }),
    };

    const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
            where,
            orderBy: { date: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.transaction.count({ where }),
    ]);

    return {
        transactions: transactions.map(t => ({
            ...t,
            amount: Number(t.amount),
        })),
        meta: {
            total,
            page,
            limit,
            totalPage: Math.ceil(total / limit),
        },
    };
}

export async function updateTransaction(userId: string, transactionId: string, payload: UpdateTransactionInput) {
    const transaction = await prisma.transaction.findFirst({
        where: { id: transactionId, userId },
    });

    if (!transaction) {
        throw new AppError(404, "TRANSACTION_NOT_FOUND", "Transaction not found");
    }

    const data: any = {};
    if (payload.type !== undefined) data.type = payload.type;
    if (payload.context !== undefined) data.context = payload.context;
    if (payload.amount !== undefined) data.amount = payload.amount;
    if (payload.category !== undefined) data.category = payload.category;
    if (payload.description !== undefined) data.description = payload.description ?? null;
    if (payload.date !== undefined) data.date = payload.date;

    const updated = await prisma.transaction.update({
        where: { id: transactionId },
        data,
    });

    return {
        ...updated,
        amount: Number(updated.amount),
    };
}

export async function deleteTransaction(userId: string, transactionId: string): Promise<void> {
    const { count } = await prisma.transaction.deleteMany({
        where: { id: transactionId, userId },
    });

    if (count === 0) {
        throw new AppError(404, "TRANSACTION_NOT_FOUND", "Transaction not found");
    }
}

export async function upsertFinanceBudget(userId: string, payload: CreateFinanceBudgetInput) {
    const existing = await prisma.financeBudget.findFirst({
        where: {
            userId,
            category: { equals: payload.category, mode: "insensitive" },
            month: payload.month,
            year: payload.year,
        },
    });

    let budget;
    if (existing) {
        budget = await prisma.financeBudget.update({
            where: { id: existing.id },
            data: { amount: payload.amount },
        });
    } else {
        budget = await prisma.financeBudget.create({
            data: {
                userId,
                category: payload.category,
                amount: payload.amount,
                month: payload.month,
                year: payload.year,
            },
        });
    }

    return {
        ...budget,
        amount: Number(budget.amount),
    };
}

export async function getFinanceBudgets(userId: string, month?: number, year?: number) {
    const where = {
        userId,
        ...(month !== undefined && { month }),
        ...(year !== undefined && { year }),
    };

    const budgets = await prisma.financeBudget.findMany({
        where,
        orderBy: [{ year: "desc" }, { month: "desc" }, { category: "asc" }],
    });

    return budgets.map(b => ({
        ...b,
        amount: Number(b.amount),
    }));
}

export async function getFinanceDashboard(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const currentMonthTransactions = await prisma.transaction.findMany({
        where: {
            userId,
            date: {
                gte: startDate,
                lte: endDate,
            },
        },
    });

    let totalIncome = 0;
    let totalExpense = 0;

    const expenseBreakdownMap: Record<string, number> = {};
    const incomeContextMap: Record<string, number> = {};

    currentMonthTransactions.forEach((t) => {
        const amount = Number(t.amount);
        if (t.type === "INCOME") {
            totalIncome += amount;
            incomeContextMap[t.context] = (incomeContextMap[t.context] || 0) + amount;
        } else if (t.type === "EXPENSE") {
            totalExpense += amount;
            expenseBreakdownMap[t.category] = (expenseBreakdownMap[t.category] || 0) + amount;
        }
    });

    const netBalance = totalIncome - totalExpense;

    const expenseBreakdown = Object.entries(expenseBreakdownMap).map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpense > 0 ? Number(((amount / totalExpense) * 100).toFixed(2)) : 0,
    })).sort((a, b) => b.amount - a.amount);

    const incomeContextBreakdown = Object.entries(incomeContextMap).map(([context, amount]) => ({
        context,
        amount,
        percentage: totalIncome > 0 ? Number(((amount / totalIncome) * 100).toFixed(2)) : 0,
    })).sort((a, b) => b.amount - a.amount);

    const monthlyBudgets = await prisma.financeBudget.findMany({
        where: {
            userId,
            month,
            year,
        },
    });

    const budgetAlerts = monthlyBudgets.map((b) => {
        const budgetLimit = Number(b.amount);
        const spent = expenseBreakdownMap[b.category] || 0;
        const isExceeded = spent > budgetLimit;

        return {
            id: b.id,
            category: b.category,
            budgetLimit,
            spent,
            isExceeded,
            remaining: Math.max(0, budgetLimit - spent),
            percentageSpent: budgetLimit > 0 ? Number(((spent / budgetLimit) * 100).toFixed(2)) : 0,
        };
    });

    const trendMonths: { month: number; year: number; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(year, month - 1 - i, 1);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        const label = d.toLocaleString("id-ID", { month: "short", year: "numeric" });
        trendMonths.push({ month: m, year: y, label });
    }

    const firstTrendMonth = trendMonths[0];
    if (!firstTrendMonth) {
        throw new AppError(500, "INTERNAL_SERVER_ERROR", "Failed to calculate trend range");
    }

    const trendStartDate = new Date(firstTrendMonth.year, firstTrendMonth.month - 1, 1);
    const trendTransactions = await prisma.transaction.findMany({
        where: {
            userId,
            date: {
                gte: trendStartDate,
                lte: endDate,
            },
        },
    });

    const trendData = trendMonths.map((m) => {
        let income = 0;
        let expense = 0;

        trendTransactions.forEach((t) => {
            const tDate = new Date(t.date);
            if (tDate.getMonth() + 1 === m.month && tDate.getFullYear() === m.year) {
                const amount = Number(t.amount);
                if (t.type === "INCOME") {
                    income += amount;
                } else if (t.type === "EXPENSE") {
                    expense += amount;
                }
            }
        });

        return {
            year: m.year,
            month: m.month,
            label: m.label,
            income,
            expense,
        };
    });

    return {
        summary: {
            totalIncome,
            totalExpense,
            netBalance,
        },
        expenseBreakdown,
        incomeContextBreakdown,
        budgetAlerts,
        trend: trendData,
    };
}
