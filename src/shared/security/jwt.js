import jwt from "jsonwebtoken";
import crypto from "crypto";
import { jwtConfig } from "../../config/jwt.config.js";

const generateJti = () => crypto.randomBytes(128).toString("hex");

export const signAccessToken = (user) => {
    if (!user?._id) {
        throw new Error("User ID required to sign access token");
    }

    return jwt.sign(
        {
            sub: user._id.toString(),
            role: user.role,
            type: "access"
        },
        jwtConfig.accessToken.secret,
        {
            expiresIn: jwtConfig.accessToken.expiresIn,
            algorithm: jwtConfig.accessToken.algorithm,
            issuer: jwtConfig.issuer,
            audience: jwtConfig.audience
        }
    );
};

export const signRefreshToken = (user) => {
    if (!user?._id) {
        throw new Error("User ID required to sign refresh token");
    }

    const jti = generateJti();

    const token = jwt.sign(
        {
            sub: user._id.toString(),
            type: "refresh",
            jti
        },
        jwtConfig.refreshToken.secret,
        {
            expiresIn: jwtConfig.refreshToken.expiresIn,
            algorithm: jwtConfig.refreshToken.algorithm,
            issuer: jwtConfig.issuer,
            audience: jwtConfig.audience
        }
    );

    return { token, jti }
};

export const verifyAccessToken = (token) => {
    return jwt.verify(token, jwtConfig.accessToken.secret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience
    });
};

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, jwtConfig.refreshToken.secret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience
    });
};

export const generateTokens = (user) => {
    if (!user) return null;

    const accessToken = signAccessToken(user);
    const { token: refreshToken, jti } = signRefreshToken(user);

    return {
        accessToken,
        refreshToken,
        refreshTokenMeta: {
            jti,
            userId: user._id
        }
    }
};
