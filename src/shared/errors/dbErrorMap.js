import AppError from './AppError.js';

/**
 * Normalize database-specific errors into AppError
 */
export const mapDbError = (err) => {

    // MongoDB / Mongoose Errors
    // Duplicate key (unique index)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0];

        return new AppError(`${capitalize(field)} already exists`, 409,
            { [field]: 'Duplicate value' }
        );
    }

    // Validation error (schema validation)
    if (err.name === 'ValidationError') {
        const errors = {};
        for (const key in err.errors) {
            errors[key] = err.errors[key].message;
        }
        return new AppError('Validation failed', 400, errors);
    }

    // Cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return new AppError(`Invalid ${err.path}`, 400,
            { [err.path]: 'Invalid format' }
        );
    }

    // Sequelize / SQL Errors
    // Unique constraint (Postgres / MySQL)
    if (err.name === 'SequelizeUniqueConstraintError') {
        const errors = {};
        err.errors.forEach(e => { errors[e.path] = 'Duplicate value'; });

        return new AppError('Duplicate field value', 409, errors);
    }

    // Foreign key constraint
    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return new AppError('Invalid reference', 400,
            { field: err.index || 'foreign_key' }
        );
    }

    // MySQL Native Errors
    if (err.code === 'ER_DUP_ENTRY') {
        return new AppError('Duplicate entry', 409);
    }

    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return new AppError('Invalid reference', 400);
    }

    // Fallback → Unknown DB Error
    return err;
};

const capitalize = (str = '') =>
    str.charAt(0).toUpperCase() + str.slice(1);
