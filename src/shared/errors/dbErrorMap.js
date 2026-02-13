import AppError from './AppError.js';

/**
 * Normalize database-specific errors into AppError
 */
export const mapDbError = (err) => {

    // helper to ensure details object shape
    const ensureDetails = (d) => (d && typeof d === 'object' ? d : null);

    // MongoDB / Mongoose Errors
    // Duplicate key (unique index)
    if (err && (err.code === 11000 || err.code === 'E11000')) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        const details = { [field]: 'Duplicate value' };

        return new AppError(`${capitalize(field)} already exists`, 409, ensureDetails(details), {
            code: 'ERR_DUPLICATE',
            cause: err
        });
    }

    // Validation error (schema validation)
    if (err && err.name === 'ValidationError') {
        const errors = {};
        for (const key in err.errors) {
            errors[key] = err.errors[key].message;
        }
        return new AppError('Validation failed', 400, ensureDetails(errors), {
            code: 'ERR_VALIDATION',
            cause: err
        });
    }

    // Cast error (invalid ObjectId)
    if (err && err.name === 'CastError') {
        const path = err.path || 'id';
        const details = { [path]: 'Invalid format' };
        return new AppError(`Invalid ${path}`, 400, ensureDetails(details), {
            code: 'ERR_INVALID_FORMAT',
            cause: err
        });
    }

    // Sequelize / SQL Errors
    // Unique constraint (Postgres / MySQL)
    if (err && err.name === 'SequelizeUniqueConstraintError') {
        const errors = {};
        (err.errors || []).forEach(e => {
            const key = e.path || e.field || e.column || 'field';
            errors[key] = 'Duplicate value';
        });

        return new AppError('Duplicate field value', 409, ensureDetails(errors), {
            code: 'ERR_DUPLICATE',
            cause: err
        });
    }

    // Foreign key constraint
    if (err && err.name === 'SequelizeForeignKeyConstraintError') {
        const key = (err.fields && Object.keys(err.fields)[0]) || err.index || 'foreign_key';
        const details = { [key]: 'Invalid reference' };
        return new AppError('Invalid reference', 400, ensureDetails(details), {
            code: 'ERR_INVALID_REFERENCE',
            cause: err
        });
    }

    // MySQL Native Errors
    if (err && err.code === 'ER_DUP_ENTRY') {
        return new AppError('Duplicate entry', 409, err?.details, { code: 'ERR_DUPLICATE', cause: err });
    }

    if (err && err.code === 'ER_NO_REFERENCED_ROW_2') {
        return new AppError('Invalid reference', 400, null, { code: 'ERR_INVALID_REFERENCE', cause: err });
    }

    return err;
};

const capitalize = (str = '') => {
    if (typeof str !== 'string') return '';
    if (str.length === 0) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}
