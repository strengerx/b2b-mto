import { refreshTokenCookie, clearRefreshTokenCookie } from "../../config/cookie.config.js";
import { success } from "../../shared/responses/apiResponse.js";
import catchAsync from "../../shared/utils/catchAsync.js";
import * as authService from "./auth.service.js";
import { generateTokens, verifyRefreshToken } from "../../shared/security/jwt.js";
import { storeRefreshToken, revokeRefreshToken, rotateRefreshToken } from "./tokens/rft.service.js";
import { User } from "../users/users.model.js";
import { unauthorized } from "../../shared/errors/httpErrors.js";

export const login = catchAsync(async (req, res) => {
    const credentials = { identifier: req.body.email, password: req.body.password };
    const user = await authService.verifyCredentials(credentials);

    const { accessToken, refreshToken, refreshTokenMeta } = generateTokens(user);

    await storeRefreshToken({
        userId: user._id,
        jti: refreshTokenMeta.jti,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ip: req.ip,
        userAgent: req.headers["user-agent"]
    });

    res.cookie(refreshTokenCookie.name, refreshToken, { ...refreshTokenCookie });
    return success(res, { accessToken }, "Authentication successful");
});

export const logout = catchAsync(async (req, res, next) => {
    const refreshJwt = req.cookies?.[refreshTokenCookie.name];

    if (refreshJwt) {
        try {
            await revokeRefreshToken(refreshJwt);
        } catch (err) {
            // ignore - still clear cookie
        }
    }

    res.clearCookie(refreshTokenCookie.name, { ...clearRefreshTokenCookie });

    return success(res, null, "Logout successful");
});

export const refresh = catchAsync(async (req, res, next) => {
    const refreshJwt = req.cookies?.[refreshTokenCookie.name];

    if (!refreshJwt) return next(unauthorized("Authentication required"));

    // Verify token structure and get subject
    let payload;
    try {
        payload = verifyRefreshToken(refreshJwt);
    } catch (err) {
        return next(unauthorized("Invalid or expired refresh token"));
    }

    if (payload.type !== "refresh") return next(unauthorized("Invalid token type"));

    const user = await User.findById(payload.sub);
    if (!user) return next(unauthorized("Invalid token subject"));

    // Generate new tokens
    const { accessToken, refreshToken, refreshTokenMeta } = generateTokens(user);

    // Rotate tokens in DB (revoke old, store new)
    await rotateRefreshToken({
        oldRefreshTokenJwt: refreshJwt,
        newJti: refreshTokenMeta.jti,
        userId: user._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ip: req.ip,
        userAgent: req.headers["user-agent"]
    });

    // Set new cookie
    res.cookie(refreshTokenCookie.name, refreshToken, { ...refreshTokenCookie });

    return success(res, { accessToken }, "Token refreshed");
});