export const validate = (schema) => (req, res, next) => {
    try {

        const validated = {};

        if (schema.body) {
            validated.body = schema.body.parse(req.body);
        }

        if (schema.query) {
            validated.query = schema.query.parse(req.query);
        }

        if (schema.params) {
            validated.params = schema.params.parse(req.params);
        }

        /**
         * ✅ DO NOT overwrite Express properties
         * req.body / req.query / req.params
         */

        req.validated = validated;

        next();

    } catch (err) {
        next(err);
    }
};