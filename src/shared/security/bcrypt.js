import bcrypt from 'bcrypt';
import { NODE_ENV } from '../../config/env.js';

const SALT_ROUNDS_BY_ENV = {
    development: 10,
    test: 8,
    production: 14
};

export const SALT_ROUNDS =
    SALT_ROUNDS_BY_ENV[NODE_ENV] || 12;

export const hashPassword = async (plainPassword) => {
    if (!plainPassword) {
        throw new Error('Password is required for hashing');
    }

    return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

export const comparePassword = async (
    plainPassword,
    hashedPassword
) => {
    if (!plainPassword || !hashedPassword) {
        return false;
    }

    return bcrypt.compare(plainPassword, hashedPassword);
};
