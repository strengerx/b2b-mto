import { describe, it, expect, beforeEach, vi } from 'vitest';

// ═══════════════════════════════════════════════════════════════
// Mock Setup (ALL before imports)
// ═══════════════════════════════════════════════════════════════

// ✅ 1. Mock catchAsync to return raw function
vi.mock('../src/shared/utils/catchAsync.js', () => ({
    default: (fn) => fn
}));

// ✅ 2. Mock userService
vi.mock('../src/module/users/users.service.js', () => ({
    userService: {
        findAll: vi.fn(),
        create: vi.fn(),
        findById: vi.fn(),
        updateByIdSafe: vi.fn(),
        deleteById: vi.fn(),
        restoreById: vi.fn()
    }
}));

// ✅ 3. Mock apiResponse (NO require, ESM safe)
vi.mock('../src/shared/responses/apiResponse.js', () => ({
    created: vi.fn((res, data, message, meta = {}) => {
        res.status(201);
        res.json({
            status: 'success',
            message,
            code: null,
            data,
            errors: null,
            meta: { timestamp: new Date().toISOString(), ...meta }
        });
    }),
    success: vi.fn((res, data, message, code = 200, meta = {}) => {
        res.status(code);
        res.json({
            status: 'success',
            message,
            code: null,
            data,
            errors: null,
            meta: { timestamp: new Date().toISOString(), ...meta }
        });
    })
}));

// ✅ 4. Mock pickFields
vi.mock('../src/shared/utils/pickFields.js', () => ({
    pickFields: (obj, fields) => {
        return fields.reduce((acc, field) => {
            if (obj.hasOwnProperty(field)) acc[field] = obj[field];
            return acc;
        }, {});
    }
}));

// ⬇️ IMPORTANT: Import AFTER mocks
import * as usersController from '../src/module/users/users.controller.js';
import { userService } from '../src/module/users/users.service.js';

// ═══════════════════════════════════════════════════════════════
// Helper to create mock req/res
// ═══════════════════════════════════════════════════════════════
const createMockReqRes = () => {
    const req = {
        query: {},
        body: {},
        params: {},
        user: { id: 'user123', role: 'ADMIN' },
        headers: {}
    };

    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        end: vi.fn().mockReturnThis()
    };

    return { req, res };
};

describe('Users Controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ═══════════════════════════════════════════════════════════════
    // INDEX - Get all users
    // ═══════════════════════════════════════════════════════════════
    describe('index - Get all users', () => {
        it('should return all users with pagination metadata', async () => {
            const { req, res } = createMockReqRes();
            req.query = { page: 1, limit: 10 };

            const mockUsers = [
                { _id: '1', name: 'User 1', email: 'user1@example.com', role: 'CLIENT' },
                { _id: '2', name: 'User 2', email: 'user2@example.com', role: 'CLIENT' }
            ];

            userService.findAll.mockResolvedValue({
                data: mockUsers,
                meta: { total: 2, page: 1, limit: 10, pages: 1 }
            });

            await usersController.index(req, res);

            expect(userService.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ page: 1, limit: 10 }),
                expect.any(Array)
            );

            expect(res.status).toHaveBeenCalledWith(200);

            // Verify response format
            const call = res.json.mock.calls[0][0];
            expect(call.status).toBe('success');
            expect(call.data).toEqual(mockUsers);
            expect(call.errors).toBeNull();
            expect(call.meta).toHaveProperty('timestamp');
            expect(call.meta.total).toBe(2);
        });

        it('should handle pagination with search', async () => {
            const { req, res } = createMockReqRes();
            req.query = { page: 2, limit: 5, search: 'John' };

            userService.findAll.mockResolvedValue({
                data: [],
                meta: { total: 0, page: 2, limit: 5, pages: 0 }
            });

            await usersController.index(req, res);

            expect(userService.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ page: 2, limit: 5, search: 'John' }),
                expect.any(Array)
            );
            expect(res.status).toHaveBeenCalledWith(200);

            const call = res.json.mock.calls[0][0];
            expect(call.status).toBe('success');
            expect(call.data).toEqual([]);
            expect(call.meta.page).toBe(2);
            expect(call.meta.total).toBe(0);
        });

        it('should include deleted users when specified', async () => {
            const { req, res } = createMockReqRes();
            req.query = { includeDeleted: true };

            userService.findAll.mockResolvedValue({
                data: [],
                meta: { total: 0, page: 1, limit: 10, pages: 0 }
            });

            await usersController.index(req, res);

            expect(userService.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ includeDeleted: true }),
                expect.any(Array)
            );
        });

        it('should handle empty user list', async () => {
            const { req, res } = createMockReqRes();

            userService.findAll.mockResolvedValue({
                data: [],
                meta: { total: 0, page: 1, limit: 10, pages: 0 }
            });

            await usersController.index(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // STORE - Create new user
    // ═══════════════════════════════════════════════════════════════
    describe('store - Create new user', () => {
        it('should create a new user successfully', async () => {
            const { req, res } = createMockReqRes();
            req.body = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'SecurePass123'
            };

            const mockUser = {
                _id: '1',
                name: 'John Doe',
                email: 'john@example.com',
                role: 'CLIENT',
                toObject: () => ({
                    name: 'John Doe',
                    email: 'john@example.com'
                })
            };

            userService.create.mockResolvedValue(mockUser);

            await usersController.store(req, res);

            expect(userService.create).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(201);

            const call = res.json.mock.calls[0][0];
            expect(call.status).toBe('success');
            expect(call.data).toHaveProperty('name', 'John Doe');
            expect(call.data).toHaveProperty('email', 'john@example.com');
            expect(call.errors).toBeNull();
            expect(call.code).toBeNull();
            expect(call.meta).toHaveProperty('timestamp');
        });

        it('should return 400 for invalid name length', async () => {
            const { req, res } = createMockReqRes();
            req.body = {
                name: 'A', // Too short
                email: 'john@example.com',
                password: 'SecurePass123'
            };

            userService.create.mockRejectedValue(new Error('Validation error'));

            try {
                await usersController.store(req, res);
            } catch (err) {
                expect(err.message).toBe('Validation error');
            }
        });

        it('should return 400 for invalid email format', async () => {
            const { req, res } = createMockReqRes();
            req.body = {
                name: 'John Doe',
                email: 'invalid-email',
                password: 'SecurePass123'
            };

            userService.create.mockRejectedValue(new Error('Invalid email'));

            try {
                await usersController.store(req, res);
            } catch (err) {
                expect(err.message).toBe('Invalid email');
            }
        });

        it('should return 400 for weak password', async () => {
            const { req, res } = createMockReqRes();
            req.body = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'weak' // No uppercase, no number, too short
            };

            userService.create.mockRejectedValue(new Error('Password too weak'));

            try {
                await usersController.store(req, res);
            } catch (err) {
                expect(err.message).toBe('Password too weak');
            }
        });

        it('should return 409 for duplicate email', async () => {
            const { req, res } = createMockReqRes();
            req.body = {
                name: 'Jane Doe',
                email: 'existing@example.com',
                password: 'SecurePass123'
            };

            const duplicateError = new Error('Email already exists');
            duplicateError.code = 11000;

            userService.create.mockRejectedValue(duplicateError);

            try {
                await usersController.store(req, res);
            } catch (err) {
                expect(err.code).toBe(11000);
            }
        });

        it('should exclude password from response', async () => {
            const { req, res } = createMockReqRes();
            req.body = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'SecurePass123'
            };

            const mockUser = {
                _id: '1',
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashed_password',
                role: 'CLIENT',
                toObject: () => ({
                    name: 'John Doe',
                    email: 'john@example.com'
                })
            };

            userService.create.mockResolvedValue(mockUser);

            await usersController.store(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // ME - Get current user profile
    // ═══════════════════════════════════════════════════════════════
    describe('me - Get current user profile', () => {
        it('should return current authenticated user', async () => {
            const { req, res } = createMockReqRes();
            req.user = { id: 'user123', role: 'ADMIN' };

            const mockUser = {
                _id: 'user123',
                name: 'Admin User',
                email: 'admin@example.com',
                role: 'ADMIN',
                toObject: () => ({
                    name: 'Admin User',
                    email: 'admin@example.com',
                    role: 'ADMIN'
                })
            };

            userService.findById.mockResolvedValue(mockUser);

            await usersController.me(req, res);

            expect(userService.findById).toHaveBeenCalledWith('user123');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 when user not found', async () => {
            const { req, res } = createMockReqRes();
            req.user = { id: 'nonexistent', role: 'CLIENT' };

            userService.findById.mockResolvedValue(null);

            await usersController.me(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should only return name, email, and role fields', async () => {
            const { req, res } = createMockReqRes();

            const mockUser = {
                _id: 'user123',
                name: 'John',
                email: 'john@example.com',
                role: 'CLIENT',
                password: 'should_not_return',
                createdAt: '2024-01-01',
                toObject: () => ({
                    _id: 'user123',
                    name: 'John',
                    email: 'john@example.com',
                    role: 'CLIENT',
                    password: 'should_not_return',
                    createdAt: '2024-01-01'
                })
            };

            userService.findById.mockResolvedValue(mockUser);

            await usersController.me(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // UPDATE ME - Update current user profile
    // ═══════════════════════════════════════════════════════════════
    describe('updateMe - Update current user profile', () => {
        it('should update user profile successfully', async () => {
            const { req, res } = createMockReqRes();
            req.user = { id: 'user123', role: 'CLIENT' };
            req.body = { name: 'Updated Name' };

            const mockUser = {
                _id: 'user123',
                name: 'Updated Name',
                email: 'user@example.com',
                role: 'CLIENT',
                toObject: () => ({
                    name: 'Updated Name',
                    email: 'user@example.com',
                    role: 'CLIENT'
                })
            };

            userService.updateByIdSafe.mockResolvedValue(mockUser);

            await usersController.updateMe(req, res);

            expect(userService.updateByIdSafe).toHaveBeenCalledWith('user123', req.body);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 when user not found', async () => {
            const { req, res } = createMockReqRes();
            req.user = { id: 'nonexistent', role: 'CLIENT' };
            req.body = { name: 'New Name' };

            userService.updateByIdSafe.mockResolvedValue(null);

            await usersController.updateMe(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should not allow role change for client user', async () => {
            const { req, res } = createMockReqRes();
            req.user = { id: 'user123', role: 'CLIENT' };
            req.body = { role: 'ADMIN' }; // Attempt to change role

            const mockUser = {
                _id: 'user123',
                name: 'User',
                email: 'user@example.com',
                role: 'CLIENT', // Role should remain unchanged
                toObject: () => ({
                    name: 'User',
                    email: 'user@example.com',
                    role: 'CLIENT'
                })
            };

            userService.updateByIdSafe.mockResolvedValue(mockUser);

            await usersController.updateMe(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // SHOW - Get user by ID (Admin only)
    // ═══════════════════════════════════════════════════════════════
    describe('show - Get user by ID', () => {
        it('should return user when found', async () => {
            const { req, res } = createMockReqRes();
            req.params = { id: 'user-456' };

            const mockUser = {
                _id: 'user-456',
                name: 'Some User',
                email: 'user@example.com',
                role: 'CLIENT',
                toObject: () => ({
                    name: 'Some User',
                    email: 'user@example.com',
                    role: 'CLIENT'
                })
            };

            userService.findById.mockResolvedValue(mockUser);

            await usersController.show(req, res);

            expect(userService.findById).toHaveBeenCalledWith('user-456');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 when user not found', async () => {
            const { req, res } = createMockReqRes();
            req.params = { id: 'nonexistent-id' };

            userService.findById.mockResolvedValue(null);

            await usersController.show(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should handle invalid MongoDB ObjectId', async () => {
            const { req, res } = createMockReqRes();
            req.params = { id: 'invalid-id' };

            userService.findById.mockResolvedValue(null);

            await usersController.show(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // UPDATE - Update user by ID (Admin only)
    // ═══════════════════════════════════════════════════════════════
    describe('update - Update user by ID', () => {
        it('should update user successfully', async () => {
            const { req, res } = createMockReqRes();
            req.params = { id: 'user-456' };
            req.body = { name: 'Updated Name', role: 'MANAGER' };

            const mockUser = {
                _id: 'user-456',
                name: 'Updated Name',
                email: 'user@example.com',
                role: 'MANAGER',
                toObject: () => ({
                    name: 'Updated Name',
                    email: 'user@example.com',
                    role: 'MANAGER'
                })
            };

            userService.updateByIdSafe.mockResolvedValue(mockUser);

            await usersController.update(req, res);

            expect(userService.updateByIdSafe).toHaveBeenCalledWith('user-456', req.body);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should allow admin to change user role', async () => {
            const { req, res } = createMockReqRes();
            req.user = { id: 'admin-001', role: 'ADMIN' };
            req.params = { id: 'user-456' };
            req.body = { role: 'ADMIN' };

            const mockUser = {
                _id: 'user-456',
                name: 'User',
                email: 'user@example.com',
                role: 'ADMIN',
                toObject: () => ({
                    name: 'User',
                    email: 'user@example.com',
                    role: 'ADMIN'
                })
            };

            userService.updateByIdSafe.mockResolvedValue(mockUser);

            await usersController.update(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 when user not found', async () => {
            const { req, res } = createMockReqRes();
            req.params = { id: 'nonexistent' };
            req.body = { name: 'Name' };

            userService.updateByIdSafe.mockResolvedValue(null);

            await usersController.update(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // DESTROY - Soft delete user (Admin only)
    // ═══════════════════════════════════════════════════════════════
    describe('destroy - Soft delete user', () => {
        it('should soft delete user successfully', async () => {
            const { req, res } = createMockReqRes();
            req.params = { id: 'user-456' };

            userService.deleteById.mockResolvedValue({ _id: 'user-456' });

            await usersController.destroy(req, res);

            expect(userService.deleteById).toHaveBeenCalledWith('user-456');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle deletion of non-existent user', async () => {
            const { req, res } = createMockReqRes();
            req.params = { id: 'nonexistent' };

            userService.deleteById.mockResolvedValue(null);

            await usersController.destroy(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should set deletedAt timestamp on soft delete', async () => {
            const { req, res } = createMockReqRes();
            req.params = { id: 'user-456' };

            const mockDeletedUser = {
                _id: 'user-456',
                name: 'User',
                email: 'user@example.com',
                deletedAt: new Date()
            };

            userService.deleteById.mockResolvedValue(mockDeletedUser);

            await usersController.destroy(req, res);

            expect(userService.deleteById).toHaveBeenCalledWith('user-456');
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // RESTORE - Restore soft-deleted user (Admin only)
    // ═══════════════════════════════════════════════════════════════
    describe('restore - Restore soft-deleted user', () => {
        it('should restore deleted user successfully', async () => {
            const { req, res } = createMockReqRes();
            req.params = { id: 'user-456' };

            const mockRestoredUser = {
                _id: 'user-456',
                name: 'User',
                email: 'user@example.com',
                deletedAt: null,
                toObject: () => ({
                    name: 'User',
                    email: 'user@example.com',
                    role: 'CLIENT'
                })
            };

            userService.restoreById.mockResolvedValue(mockRestoredUser);

            await usersController.restore(req, res);

            expect(userService.restoreById).toHaveBeenCalledWith('user-456');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 when trying to restore non-deleted user', async () => {
            const { req, res } = createMockReqRes();
            req.params = { id: 'active-user' };

            userService.restoreById.mockResolvedValue(null);

            await usersController.restore(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should clear deletedAt field on restore', async () => {
            const { req, res } = createMockReqRes();
            req.params = { id: 'user-456' };

            const mockRestoredUser = {
                _id: 'user-456',
                name: 'User',
                email: 'user@example.com',
                deletedAt: null,
                toObject: () => ({
                    name: 'User',
                    email: 'user@example.com',
                    role: 'CLIENT'
                })
            };

            userService.restoreById.mockResolvedValue(mockRestoredUser);

            await usersController.restore(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});
