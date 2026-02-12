export const validate = (schema) => (req, res, next) => {
    try {
        const validated = {}

        if (schema.body) validated.body = schema.body.parse(req.body)
        if (schema.query) validated.query = schema.query.parse(req.query)
        if (schema.params) validated.params = schema.params.parse(req.params)

        // overwrite request values with validated (sanitized) versions
        if (validated.body) req.body = validated.body
        if (validated.query) req.query = validated.query
        if (validated.params) req.params = validated.params

        req.validated = validated
        next()
    } catch (err) {
        next(err)
    }
}
