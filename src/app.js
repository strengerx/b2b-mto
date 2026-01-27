import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";

import { corsOptions } from "./config/cors.config.js";
import errorHandler from "./shared/errors/errorHandler.js";
import { notFound } from "./shared/errors/httpErrors.js";
import apiRoutes from "./routes.js";
import { authenticate } from "./shared/middlewares/authenticate.js";

const app = express();

app.use(helmet())
app.use(morgan("dev"));
app.use(cors(corsOptions));
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

app.use(authenticate);

app.get("/protected", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Protected route accessed",
        data: { user: req.user },
        errors: null,
        meta: {
            timestamp: new Date().toISOString()
        }
    });
});

app.use((req, res, next) => { next(notFound(`Cannot ${req.method} ${req.originalUrl}`)); });

app.use(errorHandler);

export default app;
