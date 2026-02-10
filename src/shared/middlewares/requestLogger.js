import morgan from 'morgan';

// Custom token to redact sensitive fields
morgan.token('body', (req) => {
    try {
        const clone = { ...req.body };
        // redact common password fields
        ['password', 'pwd', 'pass'].forEach(k => {
            if (Object.prototype.hasOwnProperty.call(clone, k)) clone[k] = '[REDACTED]';
        });
        return JSON.stringify(clone);
    } catch (e) {
        return '';
    }
});

const format = ':method :url :status - :response-time ms - body=:body';

export default morgan(format);
