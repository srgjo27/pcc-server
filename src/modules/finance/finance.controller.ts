import { type Request, type Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import { AppError } from "../../utils/errors.js";
import {
    createTransactionSchema,
    updateTransactionSchema,
    createFinanceBudgetSchema,
    transactionQuerySchema,
    monthlyQuerySchema,
} from "./finance.schema.js";
import {
    createTransaction,
    getTransactions,
    updateTransaction,
    deleteTransaction,
    upsertFinanceBudget,
    getFinanceBudgets,
    getFinanceDashboard,
} from "./finance.service.js";
import z from "zod";

const budgetsQuerySchema = z.object({
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export async function getTransactionsHandler(req: Request, res: Response): Promise<Response> {
    const query = transactionQuerySchema.parse(req.query);

    const cleanedQuery: { type?: "INCOME" | "EXPENSE"; category?: string; page?: number; limit?: number } = {};
    if (query.type !== undefined) cleanedQuery.type = query.type;
    if (query.category !== undefined) cleanedQuery.category = query.category;
    if (query.page !== undefined) cleanedQuery.page = query.page;
    if (query.limit !== undefined) cleanedQuery.limit = query.limit;

    const result = await getTransactions(req.user!.id, cleanedQuery);
    return sendSuccess(res, result.transactions, "Successfully retrieved transaction list", 200, result.meta);
}

export async function createTransactionHandler(req: Request, res: Response): Promise<Response> {
    const payload = createTransactionSchema.parse(req.body);
    const transaction = await createTransaction(req.user!.id, payload);
    return sendSuccess(res, transaction, "Successfully created transaction", 201);
}

export async function updateTransactionHandler(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (typeof id !== "string") {
        throw new AppError(400, "BAD_REQUEST", "Invalid transaction ID");
    }
    const payload = updateTransactionSchema.parse(req.body);
    const transaction = await updateTransaction(req.user!.id, id, payload);
    return sendSuccess(res, transaction, "Successfully updated transaction", 200);
}

export async function deleteTransactionHandler(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (typeof id !== "string") {
        throw new AppError(400, "BAD_REQUEST", "Invalid transaction ID");
    }
    await deleteTransaction(req.user!.id, id);
    return sendSuccess(res, null, "Successfully deleted transaction", 200);
}

export async function upsertBudgetHandler(req: Request, res: Response): Promise<Response> {
    const payload = createFinanceBudgetSchema.parse(req.body);
    const budget = await upsertFinanceBudget(req.user!.id, payload);
    return sendSuccess(res, budget, "Successfully set budget", 200);
}

export async function getBudgetsHandler(req: Request, res: Response): Promise<Response> {
    const query = budgetsQuerySchema.parse(req.query);
    const budgets = await getFinanceBudgets(req.user!.id, query.month, query.year);
    return sendSuccess(res, budgets, "Successfully retrieved budget list", 200);
}

export async function getDashboardHandler(req: Request, res: Response): Promise<Response> {
    const query = monthlyQuerySchema.parse(req.query);
    const dashboard = await getFinanceDashboard(req.user!.id, query.month, query.year);
    return sendSuccess(res, dashboard, "Successfully retrieved finance dashboard data", 200);
}
