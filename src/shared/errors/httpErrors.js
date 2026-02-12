import AppError from './AppError.js';

export const badRequest = (message, errors = null) => {
    return new AppError(message, 400, errors, { code: 'ERR_BAD_REQUEST' })
}

export const unauthorized = (msg = 'UNAUTHORIZED') => new AppError(msg, 401);

export const forbidden = (msg = 'FORBIDDEN') => new AppError(msg, 403);

export const notFound = (msg = 'NOT FOUND') => new AppError(msg, 404);

export const conflict = (msg = 'CONFLICT', d = null) => new AppError(msg, 409, d, { code: 'ERR_CONFLICT' });

export const TooManyRequests = (
    msg = "Too many requests",
    d = null
) =>
    new AppError(msg, 429, d, { code: 'ERR_TOO_MANY_REQUESTS' });
