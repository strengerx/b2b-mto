export const sendResponse = ({
    res,
    statusCode = 200,
    status = 'success',
    message = 'Success',
    data = null,
    errors = null,
    meta = {}
}) => {
    res.status(statusCode).json({
        status,
        message,
        data,
        errors,
        meta: {
            timestamp: new Date().toISOString(),
            ...meta
        }
    });
};
