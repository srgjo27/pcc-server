import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { create, remove, listNotes, view, update } from "./notes.controller.js";

export const notesRoutes = Router();

notesRoutes.use(requireAuth);

notesRoutes.get('/notes', listNotes);
notesRoutes.post('/notes', create);
notesRoutes.get('/notes/:id', view);
notesRoutes.put('/notes/:id', update);
notesRoutes.patch('/notes/:id', update);
notesRoutes.delete('/notes/:id', remove);
