export const RATE_LIMITS = {
    LOGIN: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5,
        message: "Too many login attempts. Please try again later."
    },

    REFRESH: {
        windowMs: 15 * 60 * 1000,
        max: 10,
        message: "Too many token refresh requests."
    },

    AUTHENTICATED: {
        windowMs: 60 * 1000, // 1 minute
        max: 100,
        message: "Rate limit exceeded."
    }
}
