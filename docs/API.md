# Todo Application - REST API Documentation

## Base URL

```
/api
```

## Error Response Schema

All error responses follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": []
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate name) |
| `INTERNAL_ERROR` | 500 | Internal server error |

### Validation Error Details

When `code` is `VALIDATION_ERROR`, the `details` array contains field-specific errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      },
      {
        "field": "dueDate",
        "message": "Due date must be a valid ISO 8601 date"
      }
    ]
  }
}
```

---

## Categories

### List Categories

```
GET /api/categories
```

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": 1,
      "name": "Work",
      "todoCount": 5,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Create Category

```
POST /api/categories
```

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | Yes | 1-50 characters, unique |

```json
{
  "name": "Work"
}
```

**Response:** `201 Created`

```json
{
  "data": {
    "id": 1,
    "name": "Work",
    "todoCount": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR` - Invalid input
- `409 CONFLICT` - Category name already exists

---

### Update Category

```
PUT /api/categories/:id
```

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Category ID |

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | Yes | 1-50 characters, unique |

```json
{
  "name": "Personal"
}
```

**Response:** `200 OK`

```json
{
  "data": {
    "id": 1,
    "name": "Personal",
    "todoCount": 5,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR` - Invalid input
- `404 NOT_FOUND` - Category not found
- `409 CONFLICT` - Category name already exists

---

### Delete Category

```
DELETE /api/categories/:id
```

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Category ID |

**Response:** `204 No Content`

**Errors:**
- `404 NOT_FOUND` - Category not found

**Note:** Deleting a category sets `categoryId` to `null` for all associated todos.

---

## Todos

### List Todos

```
GET /api/todos
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | `all` | Filter: `all`, `active`, `completed` |
| `categoryId` | integer | - | Filter by category ID (use `null` for uncategorized) |
| `sortBy` | string | `createdAt` | Sort field: `createdAt`, `dueDate` |
| `sortOrder` | string | `desc` | Sort order: `asc`, `desc` |
| `groupByCategory` | boolean | `false` | Group results by category |

**Response:** `200 OK`

Standard response:
```json
{
  "data": [
    {
      "id": 1,
      "title": "Complete project",
      "description": "Finish the todo app",
      "dueDate": "2024-01-15T00:00:00.000Z",
      "completed": false,
      "categoryId": 1,
      "category": {
        "id": 1,
        "name": "Work"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

Grouped response (when `groupByCategory=true`):
```json
{
  "data": {
    "grouped": [
      {
        "category": {
          "id": 1,
          "name": "Work"
        },
        "todos": [...]
      },
      {
        "category": null,
        "todos": [...]
      }
    ]
  }
}
```

---

### Get Todo

```
GET /api/todos/:id
```

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Todo ID |

**Response:** `200 OK`

```json
{
  "data": {
    "id": 1,
    "title": "Complete project",
    "description": "Finish the todo app",
    "dueDate": "2024-01-15T00:00:00.000Z",
    "completed": false,
    "categoryId": 1,
    "category": {
      "id": 1,
      "name": "Work"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors:**
- `404 NOT_FOUND` - Todo not found

---

### Create Todo

```
POST /api/todos
```

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `title` | string | Yes | 1-200 characters |
| `description` | string | No | Max 2000 characters |
| `dueDate` | string | No | ISO 8601 date format |
| `categoryId` | integer | No | Must reference existing category |

```json
{
  "title": "Complete project",
  "description": "Finish the todo app",
  "dueDate": "2024-01-15T00:00:00.000Z",
  "categoryId": 1
}
```

**Response:** `201 Created`

```json
{
  "data": {
    "id": 1,
    "title": "Complete project",
    "description": "Finish the todo app",
    "dueDate": "2024-01-15T00:00:00.000Z",
    "completed": false,
    "categoryId": 1,
    "category": {
      "id": 1,
      "name": "Work"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR` - Invalid input
- `404 NOT_FOUND` - Category not found (if categoryId provided)

---

### Update Todo

```
PUT /api/todos/:id
```

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Todo ID |

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `title` | string | Yes | 1-200 characters |
| `description` | string | No | Max 2000 characters, can be `null` |
| `dueDate` | string | No | ISO 8601 date format, can be `null` |
| `categoryId` | integer | No | Must reference existing category, can be `null` |
| `completed` | boolean | No | Completion status |

```json
{
  "title": "Complete project",
  "description": "Updated description",
  "dueDate": "2024-01-20T00:00:00.000Z",
  "categoryId": 2,
  "completed": false
}
```

**Response:** `200 OK`

```json
{
  "data": {
    "id": 1,
    "title": "Complete project",
    "description": "Updated description",
    "dueDate": "2024-01-20T00:00:00.000Z",
    "completed": false,
    "categoryId": 2,
    "category": {
      "id": 2,
      "name": "Personal"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR` - Invalid input
- `404 NOT_FOUND` - Todo or category not found

---

### Delete Todo

```
DELETE /api/todos/:id
```

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Todo ID |

**Response:** `204 No Content`

**Errors:**
- `404 NOT_FOUND` - Todo not found

---

### Toggle Todo Completion

```
PATCH /api/todos/:id/toggle
```

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Todo ID |

**Response:** `200 OK`

```json
{
  "data": {
    "id": 1,
    "title": "Complete project",
    "description": "Finish the todo app",
    "dueDate": "2024-01-15T00:00:00.000Z",
    "completed": true,
    "categoryId": 1,
    "category": {
      "id": 1,
      "name": "Work"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Errors:**
- `404 NOT_FOUND` - Todo not found

---

## Input Validation Summary

### Category

| Field | Rules |
|-------|-------|
| `name` | Required, string, 1-50 characters, unique, trimmed |

### Todo

| Field | Rules |
|-------|-------|
| `title` | Required, string, 1-200 characters, trimmed |
| `description` | Optional, string, max 2000 characters, trimmed |
| `dueDate` | Optional, valid ISO 8601 date string, must not be in the past (for create) |
| `categoryId` | Optional, integer, must reference existing category |
| `completed` | Optional (update only), boolean |
