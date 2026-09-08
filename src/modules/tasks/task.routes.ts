import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { create, remove, tasks, view } from "./task.controller.js";

export const taskRoutes = Router();

taskRoutes.use(requireAuth);

taskRoutes.get('/', tasks);
taskRoutes.post('/', create);
taskRoutes.get('/:id', view);
taskRoutes.delete('/:id', remove);