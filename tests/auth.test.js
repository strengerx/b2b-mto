import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import jwt from 'jsonwebtoken';

let mongod;
let app;
let agent;
let User;
let RefreshToken;

const TEST_ACCESS_SECRET = 'test_access_secret';
const TEST_REFRESH_SECRET = 'test_refresh_secret';

const getCookieValue = (res, name) => {
    const header = res.headers['set-cookie'];
    if (!header) return null;
    const cookie = header.find(c => c.startsWith(name + '='));
    if (!cookie) return null;
    return cookie.split(';')[0].split('=')[1];
};

describe('Auth flows: login, refresh (rotation), logout', () => {
    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
        process.env.JWT_ACCESS_SECRET = TEST_ACCESS_SECRET;
        process.env.JWT_REFRESH_SECRET = TEST_REFRESH_SECRET;

        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri, { dbName: 'test' });

        // import app after env and DB are ready
        app = (await import('../src/app.js')).default;

        // import models
        User = (await import('../src/module/users/users.model.js')).User;
        RefreshToken = (await import('../src/module/auth/tokens/rft.model.js')).RefreshToken;

        agent = request.agent(app);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongod.stop();
    });

    it('should register, login, refresh (rotate) and logout properly', async () => {
        const email = 'test2@example.com';
        const password = 'Password@123';

        // Register user
        const regRes = await agent.post('/api/v1/users').send({
            name: 'Test User',
            email,
            password
        });

        expect(regRes.status).toBe(201);

        // Login
        const loginRes = await agent.post('/api/v1/auth/login').send({
            email,
            password
        });

        expect(loginRes.status).toBe(200);
        const access1 = loginRes.body.data?.accessToken;
        expect(access1).toBeTruthy();

        const refreshToken1 = getCookieValue(loginRes, 'refreshToken');
        expect(refreshToken1).toBeTruthy();

        const payload1 = jwt.verify(refreshToken1, TEST_REFRESH_SECRET);
        expect(payload1.type).toBe('refresh');
        const jti1 = payload1.jti;

        const tokenDoc1 = await RefreshToken.findOne({ jti: jti1 });
        expect(tokenDoc1).toBeTruthy();
        expect(tokenDoc1.revokedAt).toBeNull();

        // Refresh (rotate)
        const refreshRes = await agent.post('/api/v1/auth/refresh').send();
        expect(refreshRes.status).toBe(200);
        const access2 = refreshRes.body.data?.accessToken;
        expect(access2).toBeTruthy();

        const refreshToken2 = getCookieValue(refreshRes, 'refreshToken');
        expect(refreshToken2).toBeTruthy();

        const payload2 = jwt.verify(refreshToken2, TEST_REFRESH_SECRET);
        const jti2 = payload2.jti;
        expect(jti2).not.toBe(jti1);

        // old token should be revoked
        const oldTokenDoc = await RefreshToken.findOne({ jti: jti1 });
        expect(oldTokenDoc).toBeTruthy();
        expect(oldTokenDoc.revokedAt).not.toBeNull();

        // new token exists active
        const newTokenDoc = await RefreshToken.findOne({ jti: jti2 });
        expect(newTokenDoc).toBeTruthy();
        expect(newTokenDoc.revokedAt).toBeNull();

        // Logout - should revoke active refresh token and clear cookie
        const logoutRes = await agent.post('/api/v1/auth/logout').send();
        expect(logoutRes.status).toBe(200);

        // cookie should be cleared (set-cookie present with Expires in past)
        const sc = logoutRes.headers['set-cookie']?.find(c => c.startsWith('refreshToken='));
        expect(sc).toBeTruthy();
        expect(sc).toMatch(/expires=Thu, 01 Jan 1970/gi);

        const afterLogoutToken = await RefreshToken.findOne({ jti: jti2 });
        expect(afterLogoutToken).toBeTruthy();
        expect(afterLogoutToken.revokedAt).not.toBeNull();
    });
});
