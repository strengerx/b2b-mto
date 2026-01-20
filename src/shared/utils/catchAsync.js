/**
 * Wrap async route handlers and forward errors to Express
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise
            .resolve(fn(req, res, next))
            .catch(next);
    };
};

export default catchAsync;
