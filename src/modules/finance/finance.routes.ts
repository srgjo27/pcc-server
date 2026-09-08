import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
    getTransactionsHandler,
    createTransactionHandler,
    updateTransactionHandler,
    deleteTransactionHandler,
    upsertBudgetHandler,
    getBudgetsHandler,
    getDashboardHandler,
} from "./finance.controller.js";

export const financeRoutes = Router();

financeRoutes.use(requireAuth);

financeRoutes.get("/transactions", getTransactionsHandler);
financeRoutes.post("/transactions", createTransactionHandler);
financeRoutes.patch("/transactions/:id", updateTransactionHandler);
financeRoutes.delete("/transactions/:id", deleteTransactionHandler);

financeRoutes.get("/budgets", getBudgetsHandler);
financeRoutes.post("/budgets", upsertBudgetHandler);

financeRoutes.get("/dashboard", getDashboardHandler);
