import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import csrfProtection from "./shared/middlewares/csrfProtection.js";
import requestLogger from "./shared/middlewares/requestLogger.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

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
app.use(cookieParser());
app.use(requestLogger);

app.get("/", (req, res) => {
    res.status(200).json({
        status: "success", message: "It's working 😎", data: null, errors: null,
        meta: {
            timestamp: new Date().toISOString()
        }
    });
});

// CSRF token endpoint - will set CSRF cookie
app.get('/api/v1/csrf-token', csrfProtection, (req, res) => {
    res.status(200).json({ csrfToken: req.csrfToken() });
});

// Mount Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/v1", apiRoutes);

app.get("/protected", authenticate, (req, res) => {
    res.status(200).json({
        status: "success", message: "Protected route accessed", data: { user: req.user }, errors: null,
        meta: {
            timestamp: new Date().toISOString()
        }
    });
});

app.use((req, res, next) => { next(notFound(`Cannot ${req.method} ${req.originalUrl}`)); });

app.use(errorHandler);

export default app;
