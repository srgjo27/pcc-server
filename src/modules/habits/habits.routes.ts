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

habitsRoutes.get('/streaks', streakSummary);

habitsRoutes.get('/', listHabits);
habitsRoutes.post('/', create);
habitsRoutes.patch('/:id', update);
habitsRoutes.delete('/:id', remove);

habitsRoutes.get('/:id/logs', listLogs);
habitsRoutes.post('/:id/logs', checkIn);
habitsRoutes.delete('/:id/logs/:date', removeCheckIn);

