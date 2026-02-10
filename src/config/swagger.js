const swaggerSpec = {
    openapi: '3.0.1',
    info: {
        title: 'B2B-MTO API',
        version: '1.0.0',
        description: 'API documentation for B2B-MTO'
    },
    servers: [
        { url: 'http://localhost:3000', description: 'Local dev' }
    ],
    paths: {
        '/api/v1/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Login',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    email: { type: 'string' },
                                    password: { type: 'string' }
                                },
                                required: ['email', 'password']
                            }
                        }
                    }
                },
                responses: {
                    '200': { description: 'Authenticated' },
                    '401': { description: 'Invalid credentials' }
                }
            }
        },
        '/api/v1/auth/refresh': {
            post: {
                tags: ['Auth'],
                summary: 'Refresh tokens (rotate)',
                responses: { '200': { description: 'Token refreshed' } }
            }
        },
        '/api/v1/auth/logout': {
            post: {
                tags: ['Auth'],
                summary: 'Logout',
                responses: { '200': { description: 'Logged out' } }
            }
        }
    }
};

export default swaggerSpec;
