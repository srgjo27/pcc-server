import authService from "./auth.service.js";
import type { Request, Response } from 'express';

class AuthController {
    async test(req: Request, res: Response) {
        const result = await authService.testConnection();
        res.json(result);
    }
}

export default new AuthController();