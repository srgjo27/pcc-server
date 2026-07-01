import { Router } from "express";
import authController from "./auth.controller.js";

const router = Router();

router.get('/test', authController.test);

export default router;