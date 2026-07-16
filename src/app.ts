import path from "node:path";

import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import { appConfig } from "./config/app.config";
import indexRoutes from "./routes/index.routes";
import healthRoutes from "./routes/health.routes";


const app = express();

app.set("trust proxy", 1);

const rootDir = process.cwd();

app.set("trust proxy", 1);

app.use(
    helmet({
        contentSecurityPolicy: false
    })
);

app.use(
    cors({
        origin: appConfig.appUrl,
        credentials: true
    })
);

app.use(compression());

app.use(cookieParser());

app.use(express.json({ limit: "2mb" }));

app.use(express.urlencoded({ extended: true }));

app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 300,
        standardHeaders: true,
        legacyHeaders: false
    })
);

app.use(express.static(path.join(rootDir, "src", "public")));

app.set("view engine", "ejs");

app.set("views", path.join(rootDir, "src", "views"));

app.use("/health", healthRoutes);

app.use("/", indexRoutes);

export default app;
