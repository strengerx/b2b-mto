import express from "express";
import morgan from "morgan";
import cors from "cors";

import errorHandler from "./shared/errors/errorHandler.js";
import { notFound } from "./shared/errors/httpErrors.js";
import apiRoutes from "./routes.js"

const app = express();

app.use(morgan("dev"));
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "15kb" }));

app.get("/", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "It's working 😎",
        data: null,
        errors: null,
        meta: {
            timestamp: new Date().toISOString()
        }
    });
});

app.use("/api/v1", apiRoutes);

app.use((req, res, next) => { next(notFound(`Cannot ${req.method} ${req.originalUrl}`)); });

app.use(errorHandler);

export default app;
