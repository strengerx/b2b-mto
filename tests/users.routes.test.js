import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// ═══════════════════════════════════════════════════════════════
// Mock Setup
// ═══════════════════════════════════════════════════════════════

// Mock the userService
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

// Mock responses
vi.mock('../src/shared/responses/apiResponse.js', () => ({
    created: vi.fn(async (res, data, message, meta = {}) => {
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
    success: vi.fn(async (res, data, message, code = 200, meta = {}) => {
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

// Mock pickFields
vi.mock('../src/shared/utils/pickFields.js', () => ({
    pickFields: (obj, fields) => {
        return fields.reduce((acc, field) => {
            if (obj?.hasOwnProperty(field)) acc[field] = obj[field];
            return acc;
        }, {});
    }
}));

// Mock catchAsync
vi.mock('../src/shared/utils/catchAsync.js', () => ({
    default: (fn) => (req, res, next) => fn(req, res, next).catch(next)
}));

// Mock authenticate middleware
const mockAuthenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const token = authHeader.split(' ')[1];
    if (token === 'valid-admin-token') {
        req.user = { id: 'admin-001', role: 'ADMIN' };
        return next();
    }
    if (token === 'valid-client-token') {
        req.user = { id: 'client-001', role: 'CLIENT' };
        return next();
    }
    return res.status(401).json({ error: 'Invalid token' });
};

// Mock authorize middleware
const mockAuthorize = (allowedRoles = []) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
        return next();
    }
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    return next();
};

// Mock validate middleware
const mockValidate = (schema) => (req, res, next) => {
    // Simple validation - check required fields
    if (schema.body) {
        const { name, email, password } = req.body;
        if (!name || name.length < 2) {
            return res.status(400).json({ error: 'Invalid name' });
        }
        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'Invalid email' });
        }
        if (password && (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password))) {
            return res.status(400).json({ error: 'Invalid password' });
        }
    }
    next();
};

// Create test Express app
const createTestApp = () => {
    const app = express();
    app.use(express.json());

    // Import controllers and routes
    const usersController = require('../src/module/users/users.controller.js');
    const { userSchema } = require('../src/module/users/users.schema.js');
    const { ROLES } = require('../src/module/users/users.constants.js');

    // Setup routes
    app.get('/users', mockAuthenticate, usersController.index);
    app.post('/users', mockValidate(userSchema), usersController.store);
    app.get('/users/me', mockAuthenticate, usersController.me);
    app.patch('/users/me', mockAuthenticate, usersController.updateMe);
    app.get('/users/:id', mockAuthenticate, mockAuthorize([ROLES.ADMIN]), usersController.show);
    app.patch('/users/:id', mockAuthenticate, mockAuthorize([ROLES.ADMIN]), usersController.update);
    app.delete('/users/:id', mockAuthenticate, mockAuthorize([ROLES.ADMIN]), usersController.destroy);
    app.post('/users/:id/restore', mockAuthenticate, mockAuthorize([ROLES.ADMIN]), usersController.restore);

    return app;
};

describe('Users Routes', () => {
    let app;
    const { userService } = require('../src/module/users/users.service.js');

    beforeEach(() => {
        vi.clearAllMocks();
        app = createTestApp();
    });

    // ═══════════════════════════════════════════════════════════════
    // INDEX ROUTE - GET /users
    // ═══════════════════════════════════════════════════════════════
    describe('GET /users - List all users', () => {
        it('should require authentication', async () => {
            const response = await request(app)
                .get('/users')
                .expect(401);

            expect(response.body.error).toBe('Authentication required');
        });

        it('should return users for authenticated requests', async () => {
            const mockUsers = [
                { _id: '1', name: 'User 1', email: 'user1@example.com', role: 'CLIENT' }
            ];

            userService.findAll.mockResolvedValue({
                data: mockUsers,
                meta: { total: 1, page: 1, limit: 10, pages: 1 }
            });

            const response = await request(app)
                .get('/users')
                .set('Authorization', 'Bearer valid-admin-token')
                .expect(200);

            expect(response.body.status).toBe('success');
        });

        it('should support pagination query parameters', async () => {
            userService.findAll.mockResolvedValue({
                data: [],
                meta: { total: 0, page: 2, limit: 5, pages: 0 }
            });

            await request(app)
                .get('/users?page=2&limit=5')
                .set('Authorization', 'Bearer valid-admin-token')
                .expect(200);

            expect(userService.findAll).toHaveBeenCalledWith({ page: '2', limit: '5' });
        });

        it('should support search query', async () => {
            userService.findAll.mockResolvedValue({
                data: [],
                meta: { total: 0, page: 1, limit: 10, pages: 0 }
            });

            await request(app)
                .get('/users?search=john')
                .set('Authorization', 'Bearer valid-admin-token')
                .expect(200);

            expect(userService.findAll).toHaveBeenCalledWith({ search: 'john' });
        });

        it('should work for both admin and client users', async () => {
            userService.findAll.mockResolvedValue({
                data: [],
                meta: { total: 0, page: 1, limit: 10, pages: 0 }
            });

            // Test with client token
            await request(app)
                .get('/users')
                .set('Authorization', 'Bearer valid-client-token')
                .expect(200);

            expect(userService.findAll).toHaveBeenCalled();
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // STORE ROUTE - POST /users
    // ═══════════════════════════════════════════════════════════════
    describe('POST /users - Create new user', () => {
        it('should create user with valid data', async () => {
            const userData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'SecurePass123'
            };

            const mockUser = {
                _id: '1',
                name: 'John Doe',
                email: 'john@example.com',
                role: 'CLIENT',
                toObject: () => ({ name: 'John Doe', email: 'john@example.com' })
            };

            userService.create.mockResolvedValue(mockUser);

            const response = await request(app)
                .post('/users')
                .send(userData)
                .expect(201);

            expect(response.body.status).toBe('success');
            expect(userService.create).toHaveBeenCalledWith(userData);
        });

        it('should not require authentication for registration', async () => {
            const userData = {
                name: 'Jane Doe',
                email: 'jane@example.com',
                password: 'SecurePass456'
            };

            const mockUser = {
                _id: '2',
                name: 'Jane Doe',
                email: 'jane@example.com',
                role: 'CLIENT',
                toObject: () => ({ name: 'Jane Doe', email: 'jane@example.com' })
            };

            userService.create.mockResolvedValue(mockUser);

            const response = await request(app)
                .post('/users')
                .send(userData)
                .expect(201);

            expect(response.body.status).toBe('success');
        });

        it('should return 400 for missing name', async () => {
            const response = await request(app)
                .post('/users')
                .send({
                    email: 'john@example.com',
                    password: 'SecurePass123'
                })
                .expect(400);

            expect(response.body.error).toBe('Invalid name');
        });

        it('should return 400 for invalid email', async () => {
            const response = await request(app)
                .post('/users')
                .send({
                    name: 'John Doe',
                    email: 'not-an-email',
                    password: 'SecurePass123'
                })
                .expect(400);

            expect(response.body.error).toBe('Invalid email');
        });

        it('should return 400 for weak password', async () => {
            const response = await request(app)
                .post('/users')
                .send({
                    name: 'John Doe',
                    email: 'john@example.com',
                    password: 'weak'
                })
                .expect(400);

            expect(response.body.error).toBe('Invalid password');
        });

        it('should return 400 for name too short', async () => {
            const response = await request(app)
                .post('/users')
                .send({
                    name: 'A',
                    email: 'john@example.com',
                    password: 'SecurePass123'
                })
                .expect(400);

            expect(response.body.error).toBe('Invalid name');
        });

        it('should exclude password from response', async () => {
            const userData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'SecurePass123'
            };

            const mockUser = {
                _id: '1',
                name: 'John Doe',
                email: 'john@example.com',
                password: 'hashed_password', // Should not be in response
                role: 'CLIENT',
                toObject: () => ({ name: 'John Doe', email: 'john@example.com' })
            };

            userService.create.mockResolvedValue(mockUser);

            const response = await request(app)
                .post('/users')
                .send(userData)
                .expect(201);

            expect(response.body.data).not.toHaveProperty('password');
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // ME ROUTE - GET /users/me
    // ═══════════════════════════════════════════════════════════════
    describe('GET /users/me - Get current user', () => {
        it('should require authentication', async () => {
            const response = await request(app)
                .get('/users/me')
                .expect(401);

            expect(response.body.error).toBe('Authentication required');
        });

        it('should return current user profile', async () => {
            const mockUser = {
                _id: 'admin-001',
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

            const response = await request(app)
                .get('/users/me')
                .set('Authorization', 'Bearer valid-admin-token')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(userService.findById).toHaveBeenCalledWith('admin-001');
        });

        it('should return 404 for non-existent user', async () => {
            userService.findById.mockResolvedValue(null);

            const response = await request(app)
                .get('/users/me')
                .set('Authorization', 'Bearer valid-admin-token')
                .expect(404);

            expect(response.body.data).toBeNull();
        });

        it('should work for different user roles', async () => {
            const mockClientUser = {
                _id: 'client-001',
                name: 'Client User',
                email: 'client@example.com',
                role: 'CLIENT',
                toObject: () => ({
                    name: 'Client User',
                    email: 'client@example.com',
                    role: 'CLIENT'
                })
            };

            userService.findById.mockResolvedValue(mockClientUser);

            const response = await request(app)
                .get('/users/me')
                .set('Authorization', 'Bearer valid-client-token')
                .expect(200);

            expect(response.body.status).toBe('success');
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // UPDATE ME ROUTE - PATCH /users/me
    // ═══════════════════════════════════════════════════════════════
    describe('PATCH /users/me - Update current user', () => {
        it('should require authentication', async () => {
            const response = await request(app)
                .patch('/users/me')
                .send({ name: 'New Name' })
                .expect(401);

            expect(response.body.error).toBe('Authentication required');
        });

        it('should update user profile', async () => {
            const updateData = { name: 'Updated Name' };

            const mockUser = {
                _id: 'client-001',
                name: 'Updated Name',
                email: 'client@example.com',
                role: 'CLIENT',
                toObject: () => ({
                    name: 'Updated Name',
                    email: 'client@example.com',
                    role: 'CLIENT'
                })
            };

            userService.updateByIdSafe.mockResolvedValue(mockUser);

            const response = await request(app)
                .patch('/users/me')
                .set('Authorization', 'Bearer valid-client-token')
                .send(updateData)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(userService.updateByIdSafe).toHaveBeenCalledWith('client-001', updateData);
        });

        it('should return 404 when user not found', async () => {
            userService.updateByIdSafe.mockResolvedValue(null);

            const response = await request(app)
                .patch('/users/me')
                .set('Authorization', 'Bearer valid-client-token')
                .send({ name: 'New Name' })
                .expect(404);

            expect(response.body.data).toBeNull();
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // SHOW ROUTE - GET /users/:id (ADMIN ONLY)
    // ═══════════════════════════════════════════════════════════════
    describe('GET /users/:id - Get user by ID', () => {
        it('should require authentication', async () => {
            const response = await request(app)
                .get('/users/user-123')
                .expect(401);

            expect(response.body.error).toBe('Authentication required');
        });

        it('should require ADMIN role', async () => {
            const response = await request(app)
                .get('/users/user-123')
                .set('Authorization', 'Bearer valid-client-token')
                .expect(403);

            expect(response.body.error).toBe('Insufficient permissions');
        });

        it('should return user for admin', async () => {
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

            const response = await request(app)
                .get('/users/user-456')
                .set('Authorization', 'Bearer valid-admin-token')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(userService.findById).toHaveBeenCalledWith('user-456');
        });

        it('should return 404 for non-existent user', async () => {
            userService.findById.mockResolvedValue(null);

            const response = await request(app)
                .get('/users/nonexistent')
                .set('Authorization', 'Bearer valid-admin-token')
                .expect(404);

            expect(response.body.data).toBeNull();
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // UPDATE ROUTE - PATCH /users/:id (ADMIN ONLY)
    // ═══════════════════════════════════════════════════════════════
    describe('PATCH /users/:id - Update user by ID', () => {
        it('should require ADMIN role', async () => {
            const response = await request(app)
                .patch('/users/user-123')
                .set('Authorization', 'Bearer valid-client-token')
                .send({ role: 'ADMIN' })
                .expect(403);

            expect(response.body.error).toBe('Insufficient permissions');
        });

        it('should update user for admin', async () => {
            const updateData = { role: 'MANAGER', name: 'Updated' };

            const mockUser = {
                _id: 'user-456',
                name: 'Updated',
                email: 'user@example.com',
                role: 'MANAGER',
                toObject: () => ({
                    name: 'Updated',
                    email: 'user@example.com',
                    role: 'MANAGER'
                })
            };

            userService.updateByIdSafe.mockResolvedValue(mockUser);

            const response = await request(app)
                .patch('/users/user-456')
                .set('Authorization', 'Bearer valid-admin-token')
                .send(updateData)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(userService.updateByIdSafe).toHaveBeenCalledWith('user-456', updateData);
        });

        it('should return 404 for non-existent user', async () => {
            userService.updateByIdSafe.mockResolvedValue(null);

            const response = await request(app)
                .patch('/users/nonexistent')
                .set('Authorization', 'Bearer valid-admin-token')
                .send({ name: 'Name' })
                .expect(404);

            expect(response.body.data).toBeNull();
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // DELETE ROUTE - DELETE /users/:id (ADMIN ONLY)
    // ═══════════════════════════════════════════════════════════════
    describe('DELETE /users/:id - Delete user', () => {
        it('should require ADMIN role', async () => {
            const response = await request(app)
                .delete('/users/user-123')
                .set('Authorization', 'Bearer valid-client-token')
                .expect(403);

            expect(response.body.error).toBe('Insufficient permissions');
        });

        it('should delete user for admin', async () => {
            userService.deleteById.mockResolvedValue({ _id: 'user-456', deletedAt: new Date() });

            const response = await request(app)
                .delete('/users/user-456')
                .set('Authorization', 'Bearer valid-admin-token')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(userService.deleteById).toHaveBeenCalledWith('user-456');
        });

        it('should handle soft delete timestamp', async () => {
            const deletedUser = {
                _id: 'user-456',
                deletedAt: new Date('2024-01-15T10:00:00Z')
            };

            userService.deleteById.mockResolvedValue(deletedUser);

            const response = await request(app)
                .delete('/users/user-456')
                .set('Authorization', 'Bearer valid-admin-token')
                .expect(200);

            expect(userService.deleteById).toHaveBeenCalledWith('user-456');
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // RESTORE ROUTE - POST /users/:id/restore (ADMIN ONLY)
    // ═══════════════════════════════════════════════════════════════
    describe('POST /users/:id/restore - Restore user', () => {
        it('should require ADMIN role', async () => {
            const response = await request(app)
                .post('/users/user-123/restore')
                .set('Authorization', 'Bearer valid-client-token')
                .expect(403);

            expect(response.body.error).toBe('Insufficient permissions');
        });

        it('should restore deleted user for admin', async () => {
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

            const response = await request(app)
                .post('/users/user-456/restore')
                .set('Authorization', 'Bearer valid-admin-token')
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(userService.restoreById).toHaveBeenCalledWith('user-456');
        });

        it('should return 404 if user not found or already active', async () => {
            userService.restoreById.mockResolvedValue(null);

            const response = await request(app)
                .post('/users/nonexistent/restore')
                .set('Authorization', 'Bearer valid-admin-token')
                .expect(404);

            expect(response.body.data).toBeNull();
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // AUTHENTICATION SCENARIOS
    // ═══════════════════════════════════════════════════════════════
    describe('Authentication scenarios', () => {
        it('should reject request with no authorization header', async () => {
            const response = await request(app)
                .get('/users')
                .expect(401);

            expect(response.body.error).toBe('Authentication required');
        });

        it('should reject request without Bearer prefix', async () => {
            const response = await request(app)
                .get('/users')
                .set('Authorization', 'Basic user:pass')
                .expect(401);

            expect(response.body.error).toBe('Authentication required');
        });

        it('should reject invalid token', async () => {
            const response = await request(app)
                .get('/users')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body.error).toBe('Invalid token');
        });

        it('should accept valid admin token', async () => {
            userService.findAll.mockResolvedValue({
                data: [],
                meta: { total: 0, page: 1, limit: 10, pages: 0 }
            });

            const response = await request(app)
                .get('/users')
                .set('Authorization', 'Bearer valid-admin-token')
                .expect(200);

            expect(response.body.status).toBe('success');
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // AUTHORIZATION SCENARIOS
    // ═══════════════════════════════════════════════════════════════
    describe('Authorization scenarios', () => {
        it('should allow admin to access admin endpoints', async () => {
            userService.findById.mockResolvedValue({
                _id: 'user-1',
                toObject: () => ({ name: 'User', email: 'user@example.com', role: 'CLIENT' })
            });

            const response = await request(app)
                .get('/users/user-1')
                .set('Authorization', 'Bearer valid-admin-token')
                .expect(200);

            expect(response.body.status).toBe('success');
        });

        it('should deny client access to admin endpoints', async () => {
            const response = await request(app)
                .get('/users/user-1')
                .set('Authorization', 'Bearer valid-client-token')
                .expect(403);

            expect(response.body.error).toBe('Insufficient permissions');
        });

        it('should allow client to access their own profile', async () => {
            userService.findById.mockResolvedValue({
                _id: 'client-001',
                toObject: () => ({ name: 'Client', email: 'client@example.com', role: 'CLIENT' })
            });

            const response = await request(app)
                .get('/users/me')
                .set('Authorization', 'Bearer valid-client-token')
                .expect(200);

            expect(response.body.status).toBe('success');
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // VALIDATION SCENARIOS
    // ═══════════════════════════════════════════════════════════════
    describe('Validation scenarios', () => {
        it('should validate email format on user creation', async () => {
            const response = await request(app)
                .post('/users')
                .send({
                    name: 'John Doe',
                    email: 'invalid.email', // Missing @
                    password: 'SecurePass123'
                })
                .expect(400);

            expect(response.body.error).toContain('Invalid email');
        });

        it('should validate password complexity', async () => {
            const response = await request(app)
                .post('/users')
                .send({
                    name: 'John Doe',
                    email: 'john@example.com',
                    password: 'onlysmall' // No uppercase or number
                })
                .expect(400);

            expect(response.body.error).toContain('Invalid password');
        });

        it('should validate name length', async () => {
            const response = await request(app)
                .post('/users')
                .send({
                    name: 'A', // Too short
                    email: 'john@example.com',
                    password: 'SecurePass123'
                })
                .expect(400);

            expect(response.body.error).toContain('Invalid name');
        });

        it('should accept valid user data', async () => {
            const mockUser = {
                _id: '1',
                toObject: () => ({ name: 'John Doe', email: 'john@example.com' })
            };

            userService.create.mockResolvedValue(mockUser);

            const response = await request(app)
                .post('/users')
                .send({
                    name: 'John Doe',
                    email: 'john@example.com',
                    password: 'SecurePass123'
                })
                .expect(201);

            expect(response.body.status).toBe('success');
        });
    });
});
