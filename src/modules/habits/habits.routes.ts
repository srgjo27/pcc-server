import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
    listHabits,
    create,
    update,
    remove,
    listLogs,
    checkIn,
    removeCheckIn,
    streakSummary
} from "./habits.controller.js";

export const habitsRoutes = Router();

habitsRoutes.use(requireAuth);

habitsRoutes.get('/habits/streaks', streakSummary);

habitsRoutes.get('/habits', listHabits);
habitsRoutes.post('/habits', create);
habitsRoutes.patch('/habits/:id', update);
habitsRoutes.delete('/habits/:id', remove);

habitsRoutes.get('/habits/:id/logs', listLogs);
habitsRoutes.post('/habits/:id/logs', checkIn);
habitsRoutes.delete('/habits/:id/logs/:date', removeCheckIn);
