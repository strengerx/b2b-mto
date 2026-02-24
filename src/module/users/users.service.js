import { BaseService } from "../../shared/services/BaseService.js";
import { User } from "./users.model.js";
import { AppError } from "../../shared/errors/AppError.js";

export default class UserService extends BaseService {

    constructor() {
        super(User, {
            searchFields: ["name", "email"],
            softDelete: true,
            defaultSort: "-createdAt"
        });
    }

    /* ============================================================
        FIND BY EMAIL (LOGIN)
    ============================================================ */

    async findByEmail(email, options = {}) {

        const filter = {
            email: email.toLowerCase()
        };

        if (this.softDelete && !options.includeDeleted) {
            filter.deletedAt = null;
        }

        const user =
            await this.model.findOne(filter);

        return this.success(user);
    }

    /* ============================================================
        CHANGE PASSWORD ✅
        (Triggers mongoose pre-save hashing)
    ============================================================ */

    async changePassword(userId, newPassword) {

        const user =
            await this.model.findById(userId);

        if (!user)
            return this.success(null);

        user.password = newPassword;

        await user.save(); // triggers hashing middleware

        return this.success(user);
    }

    /* ============================================================
        ACTIVATE / DEACTIVATE USER
    ============================================================ */

    async setActiveStatus(userId, isActive) {

        const updated =
            await this.updateAtomic(
                userId,
                { isActive }
            );

        return this.success(updated);
    }

    /* ============================================================
        FIND USERS BY ROLE
    ============================================================ */

    async findByRole(role, query = {}) {

        const safeQuery =
            this.mergeQuery(query, { role });

        return this.findAll(safeQuery);
    }

    /* ============================================================
        SAFE DELETE OVERRIDE
    ============================================================ */

    async deleteById(userId) {

        const user =
            await this.model.findById(userId);

        if (!user)
            return this.success(null);

        // Example protection
        if (user.role === "super_admin") {
            throw new AppError(
                "Super admin cannot be deleted",
                403
            );
        }

        return super.deleteById(userId);
    }
}

export const userService = new UserService();