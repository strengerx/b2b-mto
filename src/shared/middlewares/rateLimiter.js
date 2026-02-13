import rateLimit, { ipKeyGenerator } from "express-rate-limit"
import { TooManyRequests } from "../errors/httpErrors.js"

export const createRateLimiter = ({
    windowMs,
    max,
    keyGenerator,
    message
}) => {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,

        keyGenerator: keyGenerator || ((req) => {
            return req.user?.id ? `user:${req.user.id}` : ipKeyGenerator(req);
        }),

        handler: (req, res, next) => {
            next(TooManyRequests(message || "Too many requests, please try again later"))
        }
    })
}
