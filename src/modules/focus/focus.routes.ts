import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { createFocusSession, getFocusStats, listFocusSessions } from "./focus.controller.js";

export const focusRoutes = Router();

focusRoutes.use(requireAuth);

focusRoutes.post("/sessions", createFocusSession);
focusRoutes.get("/sessions", listFocusSessions);
focusRoutes.get("/stats", getFocusStats);
