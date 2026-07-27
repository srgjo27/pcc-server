import { type Request, type Response } from "express";
import { sendSuccess } from "../../utils/response.js";
import { createEvent, deleteEvent, getEventById, getEvents, updateEvent } from "./schedule.service.js";
import { createEventSchema, idParamSchema, queryEventsSchema, updateEventSchema } from "./schedule.schema.js";

export async function events(req: Request, res: Response): Promise<Response> {
    const query = queryEventsSchema.parse(req.query);
    const { events } = await getEvents(req.user!.id, query);
    return sendSuccess(res, events, "Successfully retrieved events", 200);
}

export async function create(req: Request, res: Response): Promise<Response> {
    const payload = createEventSchema.parse(req.body);
    const event = await createEvent(req.user!.id, payload);
    return sendSuccess(res, event, "Successfully created event", 201);
}

export async function view(req: Request, res: Response): Promise<Response> {
    const id = idParamSchema.parse(req.params.id);
    const event = await getEventById(req.user!.id, id);
    return sendSuccess(res, event, "Successfully retrieved the event", 200);
}

export async function remove(req: Request, res: Response): Promise<Response> {
    const id = idParamSchema.parse(req.params.id);
    await deleteEvent(req.user!.id, id);
    return sendSuccess(res, null, "Successfully deleted the event", 200);
}

export async function update(req: Request, res: Response): Promise<Response> {
    const id = idParamSchema.parse(req.params.id);
    const payload = updateEventSchema.parse(req.body);
    const event = await updateEvent(req.user!.id, id, payload);
    return sendSuccess(res, event, "Successfully updated the event", 200);
}