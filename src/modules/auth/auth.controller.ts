import type { Request, Response } from "express";
import { loginSchema, registerSchema, verifyEmailSchema } from "./auth.schema.js";
import { confirmEmail, loginUser, logoutUser, registerUser } from "./auth.service.js";
import { sendSuccess } from "../../utils/response.js";
import { getBearerToken } from "../../middleware/auth.middleware.js";

export async function register(req: Request, res: Response): Promise<Response> {
    const input = registerSchema.parse(req.body);

    const { user, session } = await registerUser(input);

    return sendSuccess(
        res,
        { user, session },
        session
            ? "Registration was successful"
            : "Registration was successful. Please check your email for account confirmation.",
        201
    );
}

export async function verifyEmail(req: Request, res: Response): Promise<Response> {
    const { token_hash } = verifyEmailSchema.parse(req.query);

    const { user, session } = await confirmEmail(token_hash);

    return sendSuccess(res, { user, session }, "Email successfully verified", 200);
}

export async function login(req: Request, res: Response): Promise<Response> {
    const input = loginSchema.parse(req.body);

    const { user, session } = await loginUser(input);

    return sendSuccess(
        res,
        { user, session },
        "Login successful",
        200
    );
}

export async function logout(req: Request, res: Response): Promise<Response> {
    const accessToken = getBearerToken(req);

    await logoutUser(accessToken);

    return sendSuccess(res, null, "Logout successful", 200);
}