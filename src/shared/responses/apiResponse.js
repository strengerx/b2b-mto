import { sendResponse } from '../utils/response.js';

export const success = (
    res,
    data = null,
    message = 'Success',
    code = 200,
    meta = {}
) => {
    return sendResponse({
        res,
        statusCode: code,
        status: 'success',
        message,
        data,
        errors: null,
        meta
    });
};

export const created = (
    res,
    data = null,
    message = 'Resource created successfully',
    meta = {}
) => {
    return sendResponse({
        res,
        statusCode: 201,
        status: 'success',
        message,
        data,
        errors: null,
        meta
    });
};
