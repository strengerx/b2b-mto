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
    path: "/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export const clearRefreshTokenCookie = {
    ...baseCookieOptions,
    name: "refreshToken",
    path: "/auth/refresh",
    expires: new Date(0)
};
