import "dotenv/config";
import type { Server } from "node:http";
import { createApp } from "./src/app.js";
import { env } from "./src/config/env.js";
import { logger } from "./src/utils/logger.js";
import { prisma } from "./src/config/prisma.js";

const app = createApp();

const server: Server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}] `)
});

async function shutdown(signal: string): Promise<void> {
    logger.info(`${signal} received, shutting down gracefully`)
    server.close(async () => {
        try {
            await prisma.$disconnect();
            logger.info("Database connection close. Server shut down.");
        } catch (err) {
            logger.error("Failed to close connection", { err });
            process.exit(1);
        }
    });

    setTimeout(() => {
        logger.error("Shutdown time out, force exit.");
        process.exit(1);
    }, 10_000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled Rejection", { reason });
});

process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception", { err });
    process.exit(1);
});
