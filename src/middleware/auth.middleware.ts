import type { Request } from "express";
import { AppError } from "../utils/errors.js";

export function getBearerToken(req: Request): string {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        throw new AppError(401, "UNAUTHORIZED", "Access token not found");
    }

    return authHeader.slice("Bearer ".length).trim();
}