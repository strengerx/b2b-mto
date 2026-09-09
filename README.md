# B2B MTO API

> A modular Node.js / Express backend for a business-to-business product catalog and management workflow.

B2B MTO is an API-oriented backend organized around independent modules for **authentication, users, categories, products, and brands**. It includes security middleware, request validation, API documentation, database persistence, centralized error handling, and automated testing infrastructure.

## Highlights

- Modular Express 5 architecture
- Authentication and user-management modules
- Product, category, and brand modules
- MongoDB persistence with Mongoose
- Zod request validation
- JWT-based authentication
- Helmet security headers
- Configurable CORS
- Cookie parsing and CSRF protection
- Express rate limiting
- Centralized error handling
- Morgan/request logging
- Swagger/OpenAPI documentation
- Vitest/Jest test tooling with Supertest
- MongoDB Memory Server support for tests

## Architecture

```text
server.js
   │
   ├── Database connection
   │
   └── HTTP server
          │
          ▼
       src/app.js
          │
          ├── Security middleware
          ├── CORS
          ├── JSON parsing
          ├── Cookies
          ├── Request logging
          ├── CSRF protection
          ├── Swagger UI
          │
          ▼
       src/routes.js
          │
          ├── auth
          ├── users
          ├── categories
          ├── products
          └── brands
          │
          ▼
       Controllers / Services / Repositories
          │
          ▼
       MongoDB
```

## API

The API is mounted under `/api/v1`.

| Module | Base responsibility |
|---|---|
| Auth | Authentication and authorization flows |
| Users | User/account management |
| Categories | Product category management |
| Products | Product management |
| Brands | Brand management |

A health-style root endpoint is available at `/`. Swagger UI is exposed at `/api-docs`, and a CSRF token endpoint is available at `/api/v1/csrf-token`.

> Check the generated Swagger documentation for the current endpoint contract rather than relying on this README as the API specification.

## Tech stack

- **Node.js** / ES Modules
- **Express 5**
- **MongoDB / Mongoose**
- **JWT** / jsonwebtoken
- **Zod**
- **Helmet**
- **CORS**
- **express-rate-limit**
- **Swagger UI + swagger-jsdoc**
- **Vitest / Jest / Supertest**

## Getting started

### Prerequisites

- Node.js
- MongoDB

### Install

```bash
npm install
```

Copy `.env.example` to your local environment configuration and provide the required database, authentication, server, and security settings.

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

## Testing

The project currently contains both Vitest and Jest test entry points:

```bash
npm test
```

```bash
npm run test:jest
```

Supertest and MongoDB Memory Server are available for API/integration testing without depending on a long-lived external test database.

## API documentation

Run the application and open:

```text
http://localhost:<PORT>/api-docs
```

Swagger is generated from the project's API documentation configuration.

## Project structure

```text
src/
├── app.js
├── routes.js
├── config/          # Environment, database, CORS and Swagger configuration
├── module/
│   ├── auth/        # Authentication
│   ├── users/       # Users
│   ├── categories/  # Categories
│   ├── products/    # Products
│   └── brands/      # Brands
└── shared/          # Cross-cutting middleware, errors and utilities

tests/               # Automated tests
server.js            # Application bootstrap
.env.example         # Environment variable template
```

## Security

Security is treated as a cross-cutting concern rather than being limited to authentication. The application currently wires Helmet, CORS configuration, request-size limits, cookie parsing, CSRF protection, rate limiting, authentication middleware, validation, and centralized error handling.

Before deploying to production, review all security configuration for your deployment model, especially trusted origins, cookies, CSRF strategy, JWT secrets/keys, rate limits, database credentials, logging, and proxy configuration.

## Roadmap / recommended improvements

- Add a single, documented API versioning strategy
- Standardize response and error schemas across every module
- Add request correlation IDs and structured logging
- Expand integration and authorization tests
- Add CI for linting, tests, dependency/security checks, and builds
- Add Docker/production deployment documentation
- Add database indexes and query-performance guidance
- Add pagination, filtering, sorting, and search contracts for catalog endpoints
- Document authentication/session lifecycle and token storage strategy
- Add OpenAPI examples for every public endpoint
- Separate test configuration and test database lifecycle from development configuration
- Add health/readiness endpoints for production orchestration

## Development philosophy

The codebase is intentionally modular: domain-specific functionality lives under `src/module`, while reusable infrastructure belongs in `src/shared`. This keeps feature modules independently understandable while avoiding duplication of cross-cutting concerns.

## Status

**Active development.** API contracts and implementation details may evolve.

## License

ISC
