import type { Response } from "express";

interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPage: number;
}

export function sendSuccess<T>(
    res: Response,
    data: T,
    message = "Success",
    statusCode = 200,
    meta?: PaginationMeta
): Response {
    return res.status(statusCode).json({
        success: true,
        data,
        message,
        ...(meta && { meta }),
    });
}