import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } from "./env.js"

export const jwtConfig = {
    accessToken: {
        secret: JWT_ACCESS_SECRET,
        expiresIn: "15m",
        algorithm: "HS256"
    },

    refreshToken: {
        secret: JWT_REFRESH_SECRET,
        expiresIn: "7d",
        algorithm: "HS256"
    },

    issuer: "b2b-mto-api",
    audience: "b2b-mto-client"
}
