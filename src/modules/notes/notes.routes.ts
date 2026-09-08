import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { create, remove, listNotes, view, update } from "./notes.controller.js";

export const notesRoutes = Router();

notesRoutes.use(requireAuth);

notesRoutes.get('/', listNotes);
notesRoutes.post('/', create);
notesRoutes.get('/:id', view);
notesRoutes.put('/:id', update);
notesRoutes.patch('/:id', update);
notesRoutes.delete('/:id', remove);

