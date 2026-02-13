import { unauthorized, forbidden } from "../errors/httpErrors.js";

export const authorize = (allowedRoles = []) => (req, res, next) => {
    if (!req.user) return next(unauthorized("Authentication required"));
    if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) return next();
    const role = req.user.role;
    if (!allowedRoles.includes(role)) return next(forbidden("Insufficient permissions"));
    return next();
};

export default authorize;
