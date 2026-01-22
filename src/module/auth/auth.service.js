import { User } from "../users/users.model.js";
import AppError from "../../shared/errors/AppError.js";
import { comparePassword } from "../../shared/security/bcrypt.js";

export const verifyCredentials = async ({
    identifier,
    password,
    constraints = {}
}) => {
    if (!identifier || !password) {
        throw new AppError("Invalid credentials", 400);
    }

    const query = {
        $or: [
            { email: identifier },
            { username: identifier }
        ]
    };

    if (constraints.status) {
        query.status = constraints.status;
    }

    if (constraints.role) {
        query.role = constraints.role;
    }

    const user = await User
        .findOne(query)
        .select("+password");

    if (!user) {
        throw new AppError("Invalid credentials [Account]", 401);
    }

    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
        throw new AppError("Invalid credentials [Password]", 401);
    }

    // if (user.isBlocked) {
    //     throw new AppError("Account is blocked", 403);
    // }

    // if (!user.isActive) {
    //     throw new AppError("Account is inactive", 403);
    // }

    return user;
};
