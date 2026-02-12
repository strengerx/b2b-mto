export default class AppError extends Error {
    constructor(message, statusCode, details = null, opts = {}) {
        super(message);

        this.statusCode = statusCode;
        this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
        this.isOperational = true;
        this.details = details ?? null;

        // structured error code (machine-friendly)
        this.code = opts.code || null;

        // preserve original/cause for diagnostics (not sent to clients by default)
        this.cause = opts.cause || null;

        Error.captureStackTrace(this, this.constructor);
    }
}