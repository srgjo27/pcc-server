import { prisma } from "../../config/prisma.js";
import { supabase } from "../../config/supabase.js";
import { AppError } from "../../utils/errors.js";
import { logger } from "../../utils/logger.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";

export async function registerUser(input: RegisterInput) {
    const { email, password, name } = input;

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            ...(name ? { data: { full_name: name } } : {}),
        },
    });

    if (error) {
        throw new AppError(400, "SUPABASE_AUTH_ERROR", error.message);
    }

    if (!data.user) {
        throw new AppError(400, "AUTH_USER_CREATION_FAILED", "Failed to create a user in Supabase Auth");
    }

    if (data.user.identities && data.user.identities.length === 0) {
        throw new AppError(409, "EMAIL_ALREADY_EXISTS", "Email address already registered");
    }

    try {
        const user = await prisma.user.create({
            data: {
                supabaseId: data.user.id,
                email: data.user.email!,
                name: name ?? null,
            },
            select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
                timezone: true,
                createdAt: true,
            }
        });

        return {
            user,
            session: data.session,
        }
    } catch (err) {
        logger.error("Failed to create a user profile, roll back the Supabase Auth user", { err });
        await rollbackSupabaseUser(data.user.id);
        throw new AppError(500, "USER_CREATION_FAILED", "Failed to save user data");
    }
}

async function rollbackSupabaseUser(supabaseId: string): Promise<void> {
    try {
        await supabase.auth.admin.deleteUser(supabaseId);
    } catch (err) {
        logger.error(
            "Supabase Auth user rollback failed - must be deleted manually", {
            err,
            supabaseId,
        }
        );
    }
}

export async function confirmEmail(tokenHash: string) {
    const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "email",
    });

    if (error) {
        throw new AppError(400, "EMAIL_VERIFICATION_FAILED", error.message);
    }

    if (!data.user || !data.session) {
        throw new AppError(500, "EMAIL_VERIFICATION_FAILED", "Failed to verify email");
    }

    const user = await prisma.user.findUnique({
        where: { supabaseId: data.user.id },
        select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            timezone: true,
            createdAt: true,
        },
    });

    if (!user) {
        logger.error("Verified user on Supabase, but profile not found", {
            supabaseId: data.user.id,
        });
        throw new AppError(404, "USER_PROFILE_NOT_FOUND", "Profile not found");
    }

    return { user, session: data.session };
}

export async function loginUser(input: LoginInput) {
    const { email, password } = input;

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        if (error.code === "email_not_confirmed") {
            throw new AppError(
                403,
                "EMAIL_NOT_CONFIRMED",
                "Your email hasn't been confirmed yet; please check your inbox.",
            );
        }

        throw new AppError(401, "INVALID_CREDENTIALS", "Incorrect email or password");
    }

    if (!data.user || !data.session) {
        throw new AppError(500, "LOGIN_FAILED", "Login Failed");
    }

    const user = await prisma.user.findUnique({
        where: { supabaseId: data.user.id },
        select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            timezone: true,
            createdAt: true,
        }
    });

    if (!user) {
        logger.error("The user successfully logged in to Supabase, but the profile was not found", {
            supabaseId: data.user.id,
        });
        throw new AppError(404, "USER_PROFILE_NOT_FOUND", "User profile not found")
    }

    return { user, session: data.session };
}

export async function logoutUser(accessToken: string, scope: "global" | "local" | "others" = "local"): Promise<void> {
    const { error } = await supabase.auth.admin.signOut(accessToken, scope);

    if (error) {
        if (error.status === 401 || error.status === 403) {
            return;
        }

        throw new AppError(400, "LOGOUT_FAILED", error.message);
    }
}