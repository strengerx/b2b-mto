# Users Module Test Suite - Updated Response Format

## 📝 Actual API Response Format

The Users module API uses the following response format:

```json
{
    "status": "success",
    "message": "All Users",
    "code": null,
    "data": [
        {
            "_id": "698eafbdfcbc5e767b3a0ec3",
            "name": "salman roy",
            "email": "salman@gmail.com",
            "role": "CLIENT"
        }
    ],
    "errors": null,
    "meta": {
        "timestamp": "2026-02-13T07:42:42.130Z",
        "total": 3,
        "page": 1,
        "limit": 10,
        "pages": 1
    }
}
```

## 📊 Response Fields Explanation

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| **status** | string | Response status (success/error) | "success" |
| **message** | string | Human-readable message | "All Users" |
| **code** | null | Error code (always null for now) | null |
| **data** | array/object/null | Response payload | [...users] or {...user} |
| **errors** | null | Error details (always null for now) | null |
| **meta** | object | Metadata including timestamp & pagination | {...} |

## 🕐 Metadata Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| **timestamp** | string | ISO 8601 timestamp | "2026-02-13T07:42:42.130Z" |
| **total** | number | Total items matching query | 3 |
| **page** | number | Current page number (1-based) | 1 |
| **limit** | number | Items per page | 10 |
| **pages** | number | Total number of pages | 1 |

## 👤 User Data Fields (in List Response)

|  Field | Type | Include | Example |
|--------|------|---------|---------|
| **_id** | string | ✅ Yes | "698eafbdfcbc5e767b3a0ec3" |
| **name** | string | ✅ Yes | "salman roy" |
| **email** | string | ✅ Yes | "salman@gmail.com" |
| **role** | string | ✅ Yes | "CLIENT" |
| **password** | string | ❌ No (filtered) | - |
| **createdAt** | date | ❌ No (filtered) | - |
| **updatedAt** | date | ❌ No (filtered) | - |

## 📝 Create User Response Format

```json
{
    "status": "success",
    "message": "User created successfully",
    "code": null,
    "data": {
        "name": "John Doe",
        "email": "john@example.com"
    },
    "errors": null,
    "meta": {
        "timestamp": "2026-02-13T07:50:00.000Z"
    }
}
```

**Note:** Create response excludes `_id` and `role` for security

## ❌ Error Response Format

```json
{
    "status": "error",
    "message": "User not found",
    "code": null,
    "data": null,
    "errors": null,
    "meta": {
        "timestamp": "2026-02-13T07:50:00.000Z"
    }
}
```

## 🔑 Request/Response Examples

### GET /users - List all users

**Request:**
```bash
GET /users?page=1&limit=10&search=salman
Host: localhost:3000
Authorization: Bearer <token>
```

**Response (200):**
```json
{
    "status": "success",
    "message": "All Users",
    "code": null,
    "data": [
        {
            "_id": "698eafbdfcbc5e767b3a0ec3",
            "name": "salman roy",
            "email": "salman@gmail.com",
            "role": "CLIENT"
        }
    ],
    "errors": null,
    "meta": {
        "timestamp": "2026-02-13T07:42:42.130Z",
        "total": 1,
        "page": 1,
        "limit": 10,
        "pages": 1
    }
}
```

### POST /users - Create new user

**Request:**
```json
POST /users
Content-Type: application/json

{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
}
```

**Response (201):**
```json
{
    "status": "success",
    "message": "User created successfully",
    "code": null,
    "data": {
        "name": "John Doe",
        "email": "john@example.com"
    },
    "errors": null,
    "meta": {
        "timestamp": "2026-02-13T07:50:00.000Z"
    }
}
```

### GET /users/me - Get current user

**Response (200):**
```json
{
    "status": "success",
    "message": "Current user",
    "code": null,
    "data": {
        "name": "Admin User",
        "email": "admin@example.com",
        "role": "ADMIN"
    },
    "errors": null,
    "meta": {
        "timestamp": "2026-02-13T07:50:00.000Z"
    }
}
```

## 📊 Test Suite Updated

The test suite now includes:

### **users.responseFormat.test.js** (38 tests) ✅ NEW
Comprehensive tests validating the actual API response format:
- Response structure validation
- Field presence and types
- Pagination format
- User data validation
- Field filtering
- Real-world scenarios
- Response consistency

### Response Format Test Coverage:

✅ **Response Structure (6 tests)**
- Success response has all required fields
- Timestamp formats correctly
- Pagination metadata structure
- Data array fields
- Created response format
- Error response format

✅ **GET /users Format (5 tests)**
- User list structure
- Pagination info
- User fields validation
- Multiple roles handling
- Code field set to null

✅ **POST /users Format (3 tests)**
- Success status
- Sensitive field filtering
- Timestamp presence

✅ **Error Responses (3 tests)**
- Error status value
- Errors field is null
- Timestamp always present

✅ **User Data Validation (5 tests)**
- Name validation
- Email format
- Valid role values
- ObjectId format
- Password field excluded

✅ **Pagination (5 tests)**
- Page count calculation
- Page number >= 1
- Positive limit
- Max limit enforcement
- Zero or positive total

✅ **Field Filtering (3 tests)**
- List response fields
- Created response fields
- Timestamp fields excluded

✅ **Real Scenarios (3 tests)**
- Empty data array
- Multiple pages
- Search results

✅ **Consistency (5 tests)**
- Status field always present
- Message field always present
- Meta with timestamp
- Code always null
- Errors always null

## 🔄 Response Format Rules

### Always Include:
- ✅ `status` - "success" or "error"
- ✅ `message` - Human-readable string
- ✅ `code` - null (reserved for future use)
- ✅ `data` - Response payload
- ✅ `errors` - null (reserved for future use)
- ✅ `meta.timestamp` - ISO 8601 timestamp

### Conditional Fields in Meta:
- ✅ If list response: `total`, `page`, `limit`, `pages`
- ✅ If single response: timestamp only

### Field Filtering Rules:
- ✅ List: Include `_id`, `name`, `email`, `role`
- ✅ Create: Include `name`, `email` only
- ✅ Profile: Include `name`, `email`, `role`
- ✅ Never expose: `password`, `createdAt`, `updatedAt`, `deletedAt`

## 📈 Pagination Format

For paginated responses:
```javascript
meta: {
    timestamp: "ISO-8601-string",
    total: 100,           // Total matching items
    page: 1,              // Current page (1-based)
    limit: 10,            // Items per page
    pages: 10             // Total pages (ceil(total/limit))
}
```

## ✅ Test Execution

```bash
# Run response format tests
npm test -- users.responseFormat.test.js --run

# Result
✓ 38 passed
✓ All response format validations pass
```

## 🔧 HTTP Status Codes

| Code | Meaning | Response Status |
|------|---------|-----------------|
| **200** | OK | "success" |
| **201** | Created | "success" |
| **400** | Bad Request | "error" |
| **401** | Unauthorized | "error" |
| **403** | Forbidden | "error" |
| **404** | Not Found | "error" |
| **409** | Conflict | "error" |
| **500** | Server Error | "error" |

## 📋 Summary

✅ Response format is **consistent** across all endpoints
✅ All responses include **timestamp** in meta
✅ Sensitive fields are **filtered** automatically
✅ Pagination metadata is **always present** in lists
✅ **38 comprehensive tests** validate response format
✅ Format follows **REST API best practices**

---

**Updated:** February 13, 2026
**Status:** ✅ Compliant with actual API
**Tests:** 38 ✅ All Passing
