import { User } from "../users/users.model.js";
import AppError from "../../shared/errors/AppError.js";
import { comparePassword } from "../../shared/security/bcrypt.js";
import {
    FAKE_PASSWORD_HASH,
    VALID_CONSTRAINT_KEYS,
    INPUT_CONSTRAINTS
} from "./auth.constants.js";

/**
 * Verifies user credentials with security hardening
 * @param {Object} params - Parameters object
 * @param {string} params.identifier - Email or username
 * @param {string} params.password - User password
 * @param {Object} params.constraints - Optional query constraints (status, role)
 * @returns {Promise<Object>} Authenticated user object without password
 * @throws {AppError} For invalid credentials or account issues
 */
export const verifyCredentials = async ({
    identifier,
    password,
    constraints = {}
}) => {
    // Input validation
    if (!identifier || !password) {
        throw new AppError("Invalid credentials", 400);
    }

    // Validate input lengths to prevent excessively large queries
    if (
        identifier.length < INPUT_CONSTRAINTS.MIN_IDENTIFIER_LENGTH ||
        identifier.length > INPUT_CONSTRAINTS.MAX_IDENTIFIER_LENGTH
    ) {
        console.warn(
            `[AUTH] Invalid identifier length: ${identifier.length} from IP: ${identifier}`
        );
        throw new AppError("Invalid credentials", 400);
    }

    if (
        password.length < INPUT_CONSTRAINTS.MIN_PASSWORD_LENGTH ||
        password.length > INPUT_CONSTRAINTS.MAX_PASSWORD_LENGTH
    ) {
        console.warn("[AUTH] Invalid password length provided");
        throw new AppError("Invalid credentials", 400);
    }

    // Validate and whitelist constraint keys to prevent injection
    const validatedConstraints = {};
    for (const key of Object.keys(constraints)) {
        if (!VALID_CONSTRAINT_KEYS.includes(key)) {
            console.warn(`[AUTH] Invalid constraint key attempted: ${key}`);
            throw new AppError("Invalid query constraints", 400);
        }
        if (constraints[key]) {
            validatedConstraints[key] = constraints[key];
        }
    }

    const normalizedIdentifier = identifier.toLowerCase().trim();

    const query = {
        $or: [
            { email: normalizedIdentifier },
            { username: normalizedIdentifier }
        ],
        ...validatedConstraints
    };

    const user = await User.findOne(query).select("+password");

    // Timing Attack Mitigation:
    // Always perform password comparison, even if user doesn't exist.
    // Using a fake hash ensures consistent processing time whether the account
    // exists or not, preventing attackers from determining valid usernames/emails
    // through timing analysis.
    const passwordHash = user?.password || FAKE_PASSWORD_HASH;

    const isValid = await comparePassword(password, passwordHash);

    if (!user || !isValid) {
        console.warn(`[AUTH] Failed login attempt for identifier: ${normalizedIdentifier}`);
        throw new AppError("Invalid email or password", 401);
    }

    if (user.isBlocked) {
        console.warn(`[AUTH] Blocked account login attempt: ${user._id}`);
        throw new AppError("Account is blocked", 403);
    }

    user.password = undefined;

    console.info(`[AUTH] Successful login for user: ${user._id}`);
    return user;
};
