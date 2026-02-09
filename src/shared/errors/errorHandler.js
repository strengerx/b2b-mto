import { ZodError } from "zod"
import { sendResponse } from "../utils/response.js"
import { mapDbError } from "./dbErrorMap.js"
import AppError from "./AppError.js"

const errorHandler = (err, req, res, next) => {
    void next;
    // 1️⃣ Zod validation errors
    if (err instanceof ZodError && Array.isArray(err.issues)) {
        const details = {}

        for (const e of err.issues) {
            const field = e.path?.join(".") ?? "unknown"
            if (!details[field]) {
                details[field] = e.message
            }
        }

        err = new AppError("Validation error", 400, details)
    }

    // 2️⃣ Database errors
    err = mapDbError(err)

    // 3️⃣ Ensure err is always an AppError
    if (!(err instanceof AppError)) {
        if (err instanceof Error) {
            err = new AppError(err.message, err.statusCode || 500)
        } else {
            err = new AppError("Unexpected error", 500)
        }
    }

    const statusCode = err.statusCode
    const status = err.status

    // 4️⃣ Operational errors
    if (err.isOperational) {
        return sendResponse({
            res,
            statusCode,
            status,
            message: err.message,
            data: null,
            errors: err.details ?? null,
            meta: {
                path: req.originalUrl,
                method: req.method
            }
        })
    }

    // 5️⃣ Programming / unknown errors
    console.error("💥 CRITICAL ERROR:", err)

    return sendResponse({
        res,
        statusCode: 500,
        status: "error",
        message: "Something went wrong. Please try again later.",
        data: null,
        errors: null,
        meta: {
            path: req.originalUrl,
            method: req.method
        }
    })
}

export default errorHandler
