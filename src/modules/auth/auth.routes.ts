import { Router } from "express";
import { login, logout, register, verifyEmail } from "./auth.controller.js";

export const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.get("/verify-email", verifyEmail);
authRoutes.post("/login", login);
authRoutes.post("/logout", logout);