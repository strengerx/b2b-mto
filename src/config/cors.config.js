import { NODE_ENV } from "./env.js";

const DEV_ORIGINS = [/^http:\/\/.*\.localhost:\d+$/];

const PROD_ORIGINS = [
    /^https:\/\/strengerx\.github\.io$/,
    /^https:\/\/.*\.strengerx\.com$/,
];

const allowedOrigins =
    NODE_ENV === "production" ? PROD_ORIGINS : DEV_ORIGINS;

const isOriginAllowed = (origin) =>
    allowedOrigins.some((pattern) =>
        pattern instanceof RegExp
            ? pattern.test(origin)
            : pattern === origin
    );

export const corsOptions = {
    origin(origin, callback) {
        if (!origin) {
            if (NODE_ENV === "production") {
                return callback(new Error("CORS: Missing origin"), false);
            }
            return callback(null, true);
        }

        if (isOriginAllowed(origin)) {
            return callback(null, true);
        }

        console.warn(`🚨 CORS BLOCKED: ${origin}`);
        return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },

    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    maxAge: 86400,
};
