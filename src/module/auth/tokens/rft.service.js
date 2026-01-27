import { RefreshToken } from "./rft.model.js";
import { verifyRefreshToken } from "../../../shared/security/jwt.js";
import AppError from "../../../shared/errors/AppError.js";

export const storeRefreshToken = async ({
    userId,
    jti,
    expiresAt,
    ip,
    userAgent,
    device
}) => {
    if (!userId || !jti || !expiresAt) {
        throw new AppError("Invalid refresh token payload", 500);
    }

    return RefreshToken.create({
        userId,
        jti,
        expiresAt,
        ip,
        userAgent,
        device
    });
};

export const getValidRefreshToken = async (jti) => {
    const token = await RefreshToken.findOne({
        jti,
        revokedAt: null,
        expiresAt: { $gt: new Date() }
    });

    return token;
};

export const revokeRefreshToken = async (refreshTokenJwt) => {
    if (!refreshTokenJwt) return;

    const payload = verifyRefreshToken(refreshTokenJwt);

    if (!payload?.jti) return;

    await RefreshToken.findOneAndUpdate(
        { jti: payload.jti, revokedAt: null },
        { revokedAt: new Date() }
    );
};

export const revokeAllRefreshTokens = async (userId) => {
    if (!userId) return;

    await RefreshToken.updateMany(
        { userId, revokedAt: null },
        { revokedAt: new Date() }
    );
};

export const rotateRefreshToken = async ({
    oldRefreshTokenJwt,
    newJti,
    userId,
    expiresAt,
    ip,
    userAgent
}) => {
    const payload = verifyRefreshToken(oldRefreshTokenJwt);

    if (!payload?.jti) {
        throw new AppError("Invalid refresh token", 401);
    }

    const existing = await getValidRefreshToken(payload.jti);

    if (!existing) {
        // 🚨 replay detected
        await revokeAllRefreshTokens(userId);
        throw new AppError("Refresh token reuse detected", 401);
    }

    // revoke old
    existing.revokedAt = new Date();
    await existing.save();

    // create new
    return storeRefreshToken({
        userId,
        jti: newJti,
        expiresAt,
        ip,
        userAgent
    });
};
