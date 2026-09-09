import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
    dailyOverview,
    handleQuickAddTask,
    handleQuickAddNote,
} from "./dashboard.controller.js";

export const dashboardRoutes = Router();

dashboardRoutes.use(requireAuth);

dashboardRoutes.get("/", dailyOverview);
dashboardRoutes.post("/quick-add/task", handleQuickAddTask);
dashboardRoutes.post("/quick-add/note", handleQuickAddNote);