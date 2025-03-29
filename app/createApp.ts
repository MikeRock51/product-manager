import express from "express";
// import router from "./routes";
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();


export function createApp() {
    const app = express();
    app.use(express.json());
    // app.use(router);
    app.use(errorHandler);

    return app;
}