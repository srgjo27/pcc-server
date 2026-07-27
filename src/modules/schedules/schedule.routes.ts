import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { create, events, remove, update, view } from "./schedule.controller.js";

export const scheduleRoutes = Router();

scheduleRoutes.use(requireAuth);

scheduleRoutes.get("/", events);
scheduleRoutes.post("/", create);
scheduleRoutes.get("/:id", view);
scheduleRoutes.delete("/:id", remove);
scheduleRoutes.patch("/:id", update);