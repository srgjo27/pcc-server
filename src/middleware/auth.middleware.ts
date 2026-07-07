import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors.js";
import { supabase } from "../config/supabase.js";
import { prisma } from "../config/prisma.js";

export function getBearerToken(req: Request): string {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        throw new AppError(401, "UNAUTHORIZED", "Access token not found");
    }

    return authHeader.slice("Bearer ".length).trim();
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const accessToken = getBearerToken(req);

    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
        throw new AppError(401, "UNAUTHORIZED", "The token is invalid or has expired");
    }

    const user = await prisma.user.findUnique({
        where: { supabaseId: data.user.id },
        select: { id: true, supabaseId: true, email: true },
    });

    if (!user) {
        throw new AppError(404, "USER_PROFILE_NOT_FOUND", "Profile not found");
    }

    req.user = user;
    next();
}