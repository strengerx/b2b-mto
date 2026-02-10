import { NODE_ENV } from "./env.js";

const isProduction = NODE_ENV === "production";

export const baseCookieOptions = {
    httpOnly: true,
    secure: isProduction,              // HTTPS only in prod
    sameSite: isProduction ? "none" : "lax"
};

export const refreshTokenCookie = {
    ...baseCookieOptions,
    name: "refreshToken",
    // cookie path should cover auth endpoints (refresh + logout)
    path: "/api/v1/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export const clearRefreshTokenCookie = {
    ...baseCookieOptions,
    name: "refreshToken",
    path: "/api/v1/auth",
    expires: new Date(0)
};
