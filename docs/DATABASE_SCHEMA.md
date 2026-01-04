# Todo Application - Database Schema

## Overview

The application uses **SQLite** as the database engine with **Prisma ORM** for database access and migrations. The schema consists of two tables: `categories` and `todos`.

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────────┐
│   categories    │       │        todos        │
├─────────────────┤       ├─────────────────────┤
│ id (PK)         │───┐   │ id (PK)             │
│ name            │   │   │ title               │
│ created_at      │   │   │ description         │
│ updated_at      │   └──<│ category_id (FK)    │
└─────────────────┘       │ due_date            │
                          │ completed           │
                          │ created_at          │
                          │ updated_at          │
                          └─────────────────────┘
```

## Prisma Schema

The schema is defined in `prisma/schema.prisma`:

```prisma
model Category {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  todos     Todo[]

  @@map("categories")
}

model Todo {
  id          Int       @id @default(autoincrement())
  title       String
  description String?
  dueDate     DateTime? @map("due_date")
  completed   Boolean   @default(false)
  categoryId  Int?      @map("category_id")
  category    Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@index([categoryId])
  @@index([completed])
  @@index([dueDate])
  @@index([createdAt])
  @@map("todos")
}
```

## Tables

### categories

Stores todo categories for organization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `name` | TEXT | NOT NULL, UNIQUE | Category name (1-50 chars) |
| `created_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | DATETIME | NOT NULL | Last update timestamp |

**Indexes:**
- `categories_name_key` on `name` (unique)

---

### todos

Stores todo items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `title` | TEXT | NOT NULL | Todo title (1-200 chars) |
| `description` | TEXT | NULL | Todo description (max 2000 chars) |
| `due_date` | DATETIME | NULL | Due date |
| `completed` | BOOLEAN | NOT NULL, DEFAULT false | Completion status |
| `category_id` | INTEGER | NULL, FOREIGN KEY | Reference to categories.id |
| `created_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | DATETIME | NOT NULL | Last update timestamp |

**Foreign Keys:**
- `category_id` REFERENCES `categories(id)` ON DELETE SET NULL

**Indexes:**
- `todos_category_id_idx` on `category_id`
- `todos_completed_idx` on `completed`
- `todos_due_date_idx` on `due_date`
- `todos_created_at_idx` on `created_at`

---

## Database Commands

| Command | Description |
|---------|-------------|
| `yarn db:generate` | Generate Prisma Client |
| `yarn db:migrate` | Create and run migrations (development) |
| `yarn db:migrate:prod` | Apply migrations (production) |
| `yarn db:push` | Push schema changes without migrations |
| `yarn db:studio` | Open Prisma Studio (GUI) |
| `yarn db:seed` | Seed the database |

---

## Migrations

Migrations are stored in `prisma/migrations/` and managed by Prisma. Each migration folder contains:
- `migration.sql` - The SQL statements executed

### Current Migrations

1. **`20260103194502_init`** - Initial schema with categories and todos tables

### Creating New Migrations

```bash
# After modifying prisma/schema.prisma
yarn db:migrate --name <migration_name>
```

---

## Prisma Client Usage

```typescript
import { prisma } from './db/client.ts';

// Get all todos with category
const todos = await prisma.todo.findMany({
  include: { category: true }
});

// Get active todos
const activeTodos = await prisma.todo.findMany({
  where: { completed: false }
});

// Get category with todo count
const categories = await prisma.category.findMany({
  include: {
    _count: { select: { todos: true } }
  }
});

// Create a todo
const todo = await prisma.todo.create({
  data: {
    title: 'New Task',
    categoryId: 1
  }
});
```

---

## Data Conventions

### Timestamps
- Prisma handles `createdAt` automatically via `@default(now())`
- Prisma handles `updatedAt` automatically via `@updatedAt`
- Timestamps are returned as JavaScript `Date` objects

### NULL Handling
- `description`: NULL when not provided
- `dueDate`: NULL when not provided
- `categoryId`: NULL when uncategorized or when referenced category is deleted (via `onDelete: SetNull`)
