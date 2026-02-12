// Fake bcrypt hash used for timing attack mitigation
// Ensures consistent processing time whether user exists or not
export const FAKE_PASSWORD_HASH = "$2b$12$CwTycUXWue0Thq9StjUM0uJ8wX9gFJ5c5Y8zq9zq9zq9zq9zq9zq9zq9";

// Valid constraint keys for credential verification
export const VALID_CONSTRAINT_KEYS = ["status", "role"];

// Input validation constraints
export const INPUT_CONSTRAINTS = {
    MIN_IDENTIFIER_LENGTH: 3,
    MAX_IDENTIFIER_LENGTH: 255,
    MIN_PASSWORD_LENGTH: 8,
    MAX_PASSWORD_LENGTH: 255
};
