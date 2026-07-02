import express, { type Application, type Request, type Response, type NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { errorHandler } from "./middleware/error.middleware.js";

export function createApp(): Application {
    const app = express();

    app.use(helmet());
    app.use(cors({
        origin: env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN.split(","),
        credentials: true,
    }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use((req: Request, _res: Response, next: NextFunction) => {
        logger.debug(`${req.method} ${req.originalUrl}`);
        next();
    });

    app.get("/health", (_req: Request, res: Response) => {
        res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
    })

    app.use((req: Request, res: Response) => {
        res.status(404).json({
            success: false,
            error: { code: "NOT_FOUND", message: `Router ${req.originalUrl} not found` },
        });
    });

    app.use(errorHandler);

    return app;
}