import z from "zod";

export const baseFinanceSchema = z.object({
    userId: z.string().uuid("Invalid user ID"),
    category: z.string().min(1, "Category is required").max(100),
    amount: z.coerce.number().min(0, "Amount must be a positive number"),
});

export const transactionTypeSchema = z.enum(["INCOME", "EXPENSE"]);
export const financeContextSchema = z.enum(["GAJI", "USAHA", "FREELANCE", "INVESTASI", "PERSONAL"]);

export const transactionSchema = baseFinanceSchema.extend({
    id: z.string().uuid().optional(),
    type: transactionTypeSchema,
    context: financeContextSchema,
    description: z.string().max(1000).nullable().optional(),
    date: z.coerce.date(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
});

export const financeBudgetSchema = baseFinanceSchema.extend({
    id: z.string().uuid().optional(),
    month: z.coerce.number().int().min(1, "Month must be between 1 and 12").max(12, "Month must be between 1 and 12"),
    year: z.coerce.number().int().min(2000, "Year must be 2000 or greater"),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
});

export const createTransactionSchema = transactionSchema.omit({
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const createFinanceBudgetSchema = financeBudgetSchema.omit({
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
});

export const updateFinanceBudgetSchema = createFinanceBudgetSchema.partial();

export const transactionQuerySchema = z.object({
    type: z.enum(["INCOME", "EXPENSE"]).optional(),
    category: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const monthlyQuerySchema = z.object({
    month: z.coerce.number().int().min(1).max(12).default(() => new Date().getMonth() + 1),
    year: z.coerce.number().int().min(2000).max(2100).default(() => new Date().getFullYear()),
});

export type BaseFinance = z.infer<typeof baseFinanceSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type FinanceBudgetInput = z.infer<typeof financeBudgetSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type CreateFinanceBudgetInput = z.infer<typeof createFinanceBudgetSchema>;
export type UpdateFinanceBudgetInput = z.infer<typeof updateFinanceBudgetSchema>;
export type TransactionQueryInput = z.infer<typeof transactionQuerySchema>;
export type MonthlyQueryInput = z.infer<typeof monthlyQuerySchema>;