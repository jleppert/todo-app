import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../db/client.ts';
import {
  createTodoSchema,
  updateTodoSchema,
  listTodosQuerySchema,
} from '../validation/schemas.ts';
import { AppError, asyncHandler } from '../middleware/errorHandler.ts';

const todosRouter = Router();

// Response types
interface CategoryInfo {
  id: number;
  name: string;
}

interface TodoResponse {
  id: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  categoryId: number | null;
  category: CategoryInfo | null;
  createdAt: string;
  updatedAt: string;
}

interface TodoListResponse {
  data: TodoResponse[];
}

interface GroupedTodoResponse {
  data: {
    grouped: Array<{
      category: CategoryInfo | null;
      todos: TodoResponse[];
    }>;
  };
}

interface SingleTodoResponse {
  data: TodoResponse;
}

// Helper to format todo response
function formatTodo(
  todo: {
    id: number;
    title: string;
    description: string | null;
    dueDate: Date | null;
    completed: boolean;
    categoryId: number | null;
    category: { id: number; name: string } | null;
    createdAt: Date;
    updatedAt: Date;
  }
): TodoResponse {
  return {
    id: todo.id,
    title: todo.title,
    description: todo.description,
    dueDate: todo.dueDate?.toISOString() ?? null,
    completed: todo.completed,
    categoryId: todo.categoryId,
    category: todo.category ? { id: todo.category.id, name: todo.category.name } : null,
    createdAt: todo.createdAt.toISOString(),
    updatedAt: todo.updatedAt.toISOString(),
  };
}

// GET /api/todos - List todos with filtering and sorting
todosRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response<TodoListResponse | GroupedTodoResponse>) => {
    const query = listTodosQuerySchema.parse(req.query);

    // Build where clause
    const where: {
      completed?: boolean;
      categoryId?: number | null;
    } = {};

    if (query.status === 'active') {
      where.completed = false;
    } else if (query.status === 'completed') {
      where.completed = true;
    }

    if (query.categoryId !== undefined) {
      where.categoryId = query.categoryId;
    }

    // Build order by
    const orderBy: Record<string, 'asc' | 'desc'> = {
      [query.sortBy]: query.sortOrder,
    };

    const todos = await prisma.todo.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy,
    });

    const formattedTodos = todos.map(formatTodo);

    // Group by category if requested
    if (query.groupByCategory) {
      const grouped = new Map<number | null, TodoResponse[]>();

      for (const todo of formattedTodos) {
        const key = todo.categoryId;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(todo);
      }

      // Get all categories for proper ordering
      const categories = await prisma.category.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });

      const result: Array<{ category: CategoryInfo | null; todos: TodoResponse[] }> = [];

      // Add categories with todos
      for (const category of categories) {
        const categoryTodos = grouped.get(category.id);
        if (categoryTodos && categoryTodos.length > 0) {
          result.push({
            category: { id: category.id, name: category.name },
            todos: categoryTodos,
          });
        }
      }

      // Add uncategorized todos at the end
      const uncategorized = grouped.get(null);
      if (uncategorized && uncategorized.length > 0) {
        result.push({
          category: null,
          todos: uncategorized,
        });
      }

      res.json({ data: { grouped: result } });
      return;
    }

    res.json({ data: formattedTodos });
  })
);

// GET /api/todos/:id - Get single todo
todosRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response<SingleTodoResponse>) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw AppError.validation('Invalid todo ID', [
        { field: 'id', message: 'ID must be a number' },
      ]);
    }

    const todo = await prisma.todo.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    if (!todo) {
      throw AppError.notFound('Todo not found');
    }

    res.json({ data: formatTodo(todo) });
  })
);

// POST /api/todos - Create todo
todosRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response<SingleTodoResponse>) => {
    const validated = createTodoSchema.parse(req.body);

    // Check if category exists when provided
    if (validated.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: validated.categoryId },
      });
      if (!category) {
        throw AppError.notFound('Category not found');
      }
    }

    const todo = await prisma.todo.create({
      data: {
        title: validated.title,
        description: validated.description ?? null,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        categoryId: validated.categoryId ?? null,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    res.status(201).json({ data: formatTodo(todo) });
  })
);

// PUT /api/todos/:id - Update todo
todosRouter.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response<SingleTodoResponse>) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw AppError.validation('Invalid todo ID', [
        { field: 'id', message: 'ID must be a number' },
      ]);
    }

    const validated = updateTodoSchema.parse(req.body);

    // Check if todo exists
    const existing = await prisma.todo.findUnique({
      where: { id },
    });

    if (!existing) {
      throw AppError.notFound('Todo not found');
    }

    // Check if category exists when provided
    if (validated.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: validated.categoryId },
      });
      if (!category) {
        throw AppError.notFound('Category not found');
      }
    }

    const todo = await prisma.todo.update({
      where: { id },
      data: {
        title: validated.title,
        description: validated.description ?? null,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        categoryId: validated.categoryId ?? null,
        completed: validated.completed ?? existing.completed,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    res.json({ data: formatTodo(todo) });
  })
);

// DELETE /api/todos/:id - Delete todo
todosRouter.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw AppError.validation('Invalid todo ID', [
        { field: 'id', message: 'ID must be a number' },
      ]);
    }

    // Check if todo exists
    const existing = await prisma.todo.findUnique({
      where: { id },
    });

    if (!existing) {
      throw AppError.notFound('Todo not found');
    }

    await prisma.todo.delete({
      where: { id },
    });

    res.status(204).send();
  })
);

// PATCH /api/todos/:id/toggle - Toggle completion status
todosRouter.patch(
  '/:id/toggle',
  asyncHandler(async (req: Request, res: Response<SingleTodoResponse>) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw AppError.validation('Invalid todo ID', [
        { field: 'id', message: 'ID must be a number' },
      ]);
    }

    // Check if todo exists
    const existing = await prisma.todo.findUnique({
      where: { id },
    });

    if (!existing) {
      throw AppError.notFound('Todo not found');
    }

    const todo = await prisma.todo.update({
      where: { id },
      data: {
        completed: !existing.completed,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    res.json({ data: formatTodo(todo) });
  })
);

export { todosRouter };
