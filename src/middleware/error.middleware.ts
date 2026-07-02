import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export function errorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
): Response {
    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "The data sent is invalid",
                details: err.issues.map((issue) => ({
                    path: issue.path.join("."),
                    message: issue.message,
                }))
            }
        });
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                ...(err.details ? { details: err.details } : {}),
            }
        });
    }

    const error = err instanceof Error ? err : new Error("Unknown error");
    logger.error(error.message, { stack: error.stack });

    return res.status(500).json({
        success: false,
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "An error occurred on the server",
        }
    });
}