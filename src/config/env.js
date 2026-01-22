import dotenv from 'dotenv';
dotenv.config();

const getEnv = (key, options = {}) => {
    const {
        defaultValue,
        required = false,
        type = 'string'
    } = options;

    let value = process.env[key];

    if (value === undefined || value === '') {
        if (required) {
            throw new Error(`❌ Missing required environment variable: ${key}`);
        }
        value = defaultValue;
    }

    if (value === undefined) return value;

    switch (type) {
        case 'number':
            return Number(value);
        case 'boolean':
            return value === 'true';
        case 'json':
            return JSON.parse(value);
        default:
            return value;
    }
};

export const NODE_ENV = getEnv('NODE_ENV', {
    defaultValue: 'development'
});

export const PORT = getEnv('PORT', {
    defaultValue: 3000,
    type: 'number'
});

export const MONGO_URI = getEnv('MONGO_URI', { required: true });

export const MONGO_POOL_SIZE = getEnv('MONGO_POOL_SIZE', {
    defaultValue: 10,
    type: 'number'
});

export const DEBUG = getEnv('DEBUG', {
    defaultValue: false,
    type: 'boolean'
});

export const JWT_ACCESS_SECRET = getEnv('JWT_ACCESS_SECRET', { defaultValue: "your_access_secret", required: true })
export const JWT_REFRESH_SECRET = getEnv('JWT_REFRESH_SECRET', { defaultValue: "your_refresh_secret", required: true })