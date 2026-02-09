import { unauthorized } from "../errors/httpErrors.js";
import { verifyAccessToken } from "../security/jwt.js";

export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) { return next(unauthorized("Authentication required")); }

    const token = authHeader.split(" ")[1];

    if (!token) { return next(unauthorized("Authentication token missing")); }

    try {
        const payload = verifyAccessToken(token);

        if (payload.type !== "access") { return next(unauthorized("Invalid authentication token")); }

        req.user = { id: payload.sub, role: payload.role };

        return next();
    } catch {
        return next(unauthorized("Invalid or expired authentication token"));
    }
};
