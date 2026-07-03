import { Router } from "express";
import { tasks } from "./task.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

export const taskRoutes = Router();

taskRoutes.use(requireAuth);

taskRoutes.get('/tasks', tasks);