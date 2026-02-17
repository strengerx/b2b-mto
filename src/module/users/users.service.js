import { BaseService } from '../../shared/services/BaseService.js';
import { User } from './users.model.js';

export default class UserService extends BaseService {
    constructor() {
        super(User, {
            searchFields: ['name', 'email'],
            softDelete: true,
            defaultSort: '-createdAt'
        });
    }

    // 🔍 Find by email (for login)
    async findByEmail(email, options = {}) {
        const query = { email: email.toLowerCase() };

        if (this.softDelete && !options.includeDeleted) {
            query.deletedAt = null;
        }

        return this.model.findOne(query);
    }

    // 🔐 Change password safely (triggers pre-save hooks)
    async changePassword(userId, newPassword) {
        const user = await this.model.findById(userId);
        if (!user) return null;

        user.password = newPassword;
        await user.save(); // important: triggers hashing middleware

        return user;
    }

    // 🚦 Activate / Deactivate user
    async setActiveStatus(userId, isActive) {
        return this.model.findByIdAndUpdate(
            userId,
            { isActive },
            { new: true }
        );
    }

    // 👑 Get users by role
    async findByRole(role, query = {}) {
        const { filter } = this.buildFilter(query);

        return this.model.find({
            ...filter,
            role
        });
    }

    // 🚫 Override delete if you want restrictions
    async deleteById(userId) {
        // You could add logic here like:
        // Prevent deleting super admin

        return super.deleteById(userId);
    }
}

export const userService = new UserService();
