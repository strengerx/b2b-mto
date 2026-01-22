import { NODE_ENV } from "./env.js";

const DEV_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5500",
];

const PROD_ORIGINS = [
    "https://strengerx.github.io"
];

const allowedOrigins =
    NODE_ENV === "production" ? PROD_ORIGINS : DEV_ORIGINS;

export const corsOptions = {
    origin(origin, callback) {
        // Allow server-to-server / curl / Postman
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(
            new Error(`CORS blocked for origin: ${origin}`),
            false
        );
    },

    credentials: true, // 🔑 required for cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With"
    ],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400 // 24 hours
};
