# Frontend Architecture

## Overview

The frontend is a React 18 application using Redux Toolkit for state management, shadcn/ui for UI components, and Tailwind CSS for styling. It communicates with the Express backend via REST API.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Redux Toolkit | State management |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| Tailwind CSS | Utility-first styling |
| shadcn/ui | UI component library |
| Radix UI | Accessible primitives |

## File Structure

```
src/frontend/
├── index.tsx                    # Application entry point
├── App.tsx                      # Root component
├── globals.css                  # Tailwind CSS + theme variables
├── index.html                   # HTML template
│
├── types/
│   └── index.ts                 # TypeScript interfaces and types
│
├── hooks/
│   └── index.ts                 # Custom hooks (useAppDispatch, useAppSelector)
│
├── lib/
│   └── utils.ts                 # Utility functions (cn for class merging)
│
├── store/
│   ├── index.ts                 # Redux store configuration
│   ├── todosSlice.ts            # Todos state & async thunks
│   └── categoriesSlice.ts       # Categories state & async thunks
│
└── components/
    ├── ui/                      # shadcn/ui components
    │   ├── button.tsx
    │   ├── card.tsx
    │   ├── input.tsx
    │   ├── textarea.tsx
    │   ├── label.tsx
    │   ├── checkbox.tsx
    │   ├── select.tsx
    │   ├── dialog.tsx
    │   ├── tabs.tsx
    │   ├── badge.tsx
    │   ├── separator.tsx
    │   ├── dropdown-menu.tsx
    │   ├── calendar.tsx
    │   ├── popover.tsx
    │   └── sonner.tsx
    │
    ├── shared/                  # Shared/common components
    │   ├── Header.tsx           # App header with navigation
    │   ├── LoadingSpinner.tsx   # Loading indicator
    │   └── ErrorMessage.tsx     # Error display with retry
    │
    ├── todos/                   # Todo feature components
    │   ├── TodoApp.tsx          # Main container/orchestrator
    │   ├── TodoList.tsx         # List container (flat or grouped)
    │   ├── TodoItem.tsx         # Single todo item
    │   ├── TodoGroup.tsx        # Category group with items
    │   ├── TodoForm.tsx         # Create/edit dialog
    │   ├── TodoFilters.tsx      # Filter controls
    │   └── EmptyState.tsx       # Empty state message
    │
    └── categories/              # Category feature components
        ├── CategoryManager.tsx  # Category management dialog
        ├── CategoryList.tsx     # List of categories
        ├── CategoryItem.tsx     # Single category item
        └── CategoryForm.tsx     # Create/edit form
```

## Component Hierarchy

```
App
└── TodoApp
    ├── Header
    │   └── [Manage Categories Button]
    │
    ├── Card (main content)
    │   ├── TodoFilters
    │   │   ├── Tabs (status: all/active/completed)
    │   │   ├── Select (category filter)
    │   │   ├── Select (sort by)
    │   │   ├── Button (sort order toggle)
    │   │   └── Checkbox (group by category)
    │   │
    │   └── TodoList
    │       ├── LoadingSpinner (when loading)
    │       ├── ErrorMessage (when error)
    │       ├── EmptyState (when no items)
    │       ├── TodoItem[] (flat list)
    │       └── TodoGroup[] (grouped view)
    │           └── TodoItem[]
    │
    ├── Button (floating action button)
    │
    ├── TodoForm (dialog)
    │   ├── Input (title)
    │   ├── Textarea (description)
    │   ├── Popover + Calendar (due date)
    │   └── Select (category)
    │
    ├── CategoryManager (dialog)
    │   ├── CategoryForm
    │   └── CategoryList
    │       └── CategoryItem[]
    │
    └── Toaster (notifications)
```

## Redux Store

### State Shape

```typescript
interface RootState {
  todos: {
    items: Todo[];
    grouped: GroupedTodos[] | null;
    selectedTodo: Todo | null;
    loading: boolean;
    error: string | null;
    filters: {
      status: 'all' | 'active' | 'completed';
      categoryId: number | null;
      sortBy: 'createdAt' | 'dueDate';
      sortOrder: 'asc' | 'desc';
      groupByCategory: boolean;
    };
  };
  categories: {
    items: Category[];
    loading: boolean;
    error: string | null;
  };
}
```

### Async Thunks

#### Todos Slice
| Thunk | API Endpoint | Description |
|-------|--------------|-------------|
| `fetchTodos` | `GET /api/todos` | Fetch todos with current filters |
| `fetchTodoById` | `GET /api/todos/:id` | Fetch single todo |
| `createTodo` | `POST /api/todos` | Create new todo |
| `updateTodo` | `PUT /api/todos/:id` | Update existing todo |
| `deleteTodo` | `DELETE /api/todos/:id` | Delete todo |
| `toggleTodo` | `PATCH /api/todos/:id/toggle` | Toggle completion |

#### Categories Slice
| Thunk | API Endpoint | Description |
|-------|--------------|-------------|
| `fetchCategories` | `GET /api/categories` | Fetch all categories |
| `createCategory` | `POST /api/categories` | Create category |
| `updateCategory` | `PUT /api/categories/:id` | Update category |
| `deleteCategory` | `DELETE /api/categories/:id` | Delete category |

### Reducers (Synchronous Actions)

#### Todos Slice
- `setStatusFilter(status)` - Set status filter
- `setCategoryFilter(categoryId)` - Set category filter
- `setSortBy(sortBy)` - Set sort field
- `setSortOrder(sortOrder)` - Set sort direction
- `setGroupByCategory(boolean)` - Toggle grouping
- `setSelectedTodo(todo)` - Select todo for editing
- `removeTodoOptimistic(id)` - Optimistic delete
- `restoreTodo(todo)` - Restore after undo
- `clearTodosError()` - Clear error state

#### Categories Slice
- `clearCategoriesError()` - Clear error state

## Components Reference

### Shared Components

#### `Header`
App header with title and category management button.

```tsx
interface HeaderProps {
  onManageCategories: () => void;
}
```

#### `LoadingSpinner`
Animated loading indicator.

```tsx
interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}
```

#### `ErrorMessage`
Error display with optional retry button.

```tsx
interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}
```

### Todo Components

#### `TodoApp`
Main container that orchestrates the todo application. Manages:
- Initial data loading
- Dialog state for forms
- Filter change handlers
- CRUD operations with toast notifications

#### `TodoList`
Renders todos as either a flat list or grouped by category.

```tsx
interface TodoListProps {
  todos: Todo[];
  grouped: GroupedTodos[] | null;
  isGrouped: boolean;
  loading: boolean;
  error: string | null;
  statusFilter: StatusFilter;
  hasCategory: boolean;
  onToggle: (id: number) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  onRetry: () => void;
  onCreateTodo: () => void;
}
```

#### `TodoItem`
Single todo item with checkbox, content, and actions menu.

```tsx
interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}
```

**Visual States:**
- Default: Normal styling
- Completed: Strikethrough title, reduced opacity
- Overdue: Red due date text

#### `TodoGroup`
Category header with list of todo items.

```tsx
interface TodoGroupProps {
  group: GroupedTodos;
  onToggle: (id: number) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}
```

#### `TodoForm`
Dialog for creating/editing todos.

```tsx
interface TodoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo?: Todo;
  categories: Category[];
  onSubmit: (input: CreateTodoInput | UpdateTodoInput) => Promise<void>;
}
```

**Fields:**
- Title (required, max 200 chars)
- Description (optional, max 2000 chars)
- Due Date (Calendar picker, no past dates for new todos)
- Category (Select dropdown)

#### `TodoFilters`
Filter and sort controls.

```tsx
interface TodoFiltersProps {
  filters: TodoFilters;
  categories: Category[];
  onStatusChange: (status: StatusFilter) => void;
  onCategoryChange: (categoryId: number | null) => void;
  onSortByChange: (sortBy: SortBy) => void;
  onSortOrderChange: (sortOrder: SortOrder) => void;
  onGroupByCategoryChange: (groupByCategory: boolean) => void;
}
```

#### `EmptyState`
Context-aware empty state message.

```tsx
interface EmptyStateProps {
  statusFilter: StatusFilter;
  hasCategory: boolean;
  onCreateTodo: () => void;
}
```

### Category Components

#### `CategoryManager`
Dialog for managing categories. Handles CRUD operations with undo toast for deletes.

```tsx
interface CategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

#### `CategoryList`
List of category items.

```tsx
interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}
```

#### `CategoryItem`
Single category with edit/delete actions.

```tsx
interface CategoryItemProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}
```

#### `CategoryForm`
Form for creating/editing categories.

```tsx
interface CategoryFormProps {
  category?: Category;
  onSubmit: (name: string) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}
```

## TypeScript Types

```typescript
// Core entities
interface Todo {
  id: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  categoryId: number | null;
  category: { id: number; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: number;
  name: string;
  todoCount: number;
  createdAt: string;
  updatedAt: string;
}

interface GroupedTodos {
  category: { id: number; name: string } | null;
  todos: Todo[];
}

// Filter types
type StatusFilter = 'all' | 'active' | 'completed';
type SortBy = 'createdAt' | 'dueDate';
type SortOrder = 'asc' | 'desc';

interface TodoFilters {
  status: StatusFilter;
  categoryId: number | null;
  sortBy: SortBy;
  sortOrder: SortOrder;
  groupByCategory: boolean;
}

// Input types
interface CreateTodoInput {
  title: string;
  description?: string;
  dueDate?: string;
  categoryId?: number;
}

interface UpdateTodoInput {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  categoryId?: number | null;
  completed?: boolean;
}
```

## Styling

### Tailwind CSS
All styling uses Tailwind utility classes. Custom theme colors are defined as CSS variables in `globals.css`.

### Theme Variables
```css
--background     /* Page background */
--foreground     /* Primary text */
--primary        /* Primary actions */
--secondary      /* Secondary elements */
--muted          /* Muted text/backgrounds */
--accent         /* Accent elements */
--destructive    /* Error/delete actions */
--border         /* Border colors */
--ring           /* Focus rings */
--radius         /* Border radius */
```

### Class Merging
Use the `cn()` utility from `@/lib/utils` to merge Tailwind classes:

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  className
)} />
```

## Path Aliases

The `@/` alias maps to `src/frontend/`:

```tsx
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAppDispatch } from '@/hooks';
```

## Testing

### Test Structure
```
tests/frontend/unit/
├── testUtils.tsx           # Mock store, render helpers, factories
├── shared/
│   ├── LoadingSpinner.test.tsx
│   ├── ErrorMessage.test.tsx
│   └── Header.test.tsx
├── categories/
│   ├── CategoryForm.test.tsx
│   ├── CategoryItem.test.tsx
│   └── CategoryList.test.tsx
└── todos/
    ├── TodoItem.test.tsx
    ├── TodoList.test.tsx
    ├── TodoForm.test.tsx
    ├── TodoFilters.test.tsx
    └── EmptyState.test.tsx
```

### Running Tests
```bash
yarn test:frontend           # Run all frontend tests
yarn test:frontend --coverage # With coverage report
```

### Test Utilities
- `createMockStore(preloadedState)` - Create Redux store with initial state
- `renderWithProviders(ui, options)` - Render with Redux Provider
- `createMockTodo(overrides)` - Create mock todo
- `createMockCategory(overrides)` - Create mock category
- `mockFetchSuccess(data)` - Mock successful fetch
- `mockFetchError(message)` - Mock failed fetch

## Development

### Start Development Server
```bash
yarn dev           # Both backend and frontend
yarn dev:frontend  # Frontend only (port 5173)
```

### Build for Production
```bash
yarn build:frontend  # Outputs to dist/frontend/
```

### Adding shadcn/ui Components
```bash
npx shadcn@latest add <component-name>
```

Components are installed to `src/frontend/components/ui/`.
