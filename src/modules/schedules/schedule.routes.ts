import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { create, events, remove, update, view } from "./schedule.controller.js";

export const scheduleRoutes = Router();

scheduleRoutes.use(requireAuth);

scheduleRoutes.get('/schedules', events);
scheduleRoutes.post('/schedules', create);
scheduleRoutes.get('/schedules/:id', view);
scheduleRoutes.delete('/schedules/:id', remove);
scheduleRoutes.patch('/schedules/:id', update);