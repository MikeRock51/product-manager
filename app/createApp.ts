import express from "express";
import router from "./routes";
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

dotenv.config();

export function createApp() {
    const app = express();

    // Apply global middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Apply rate limiting to all requests
    app.use(apiLimiter);

    app.use(router);
    app.use(errorHandler);

    return app;
}