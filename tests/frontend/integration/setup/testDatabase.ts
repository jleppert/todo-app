import { prisma } from '../../../../src/backend/db/client.ts';
import type { Category, Todo } from '../../../../src/generated/prisma/client.js';

// Re-export prisma and clearDatabase
export { prisma };

export async function clearDatabase(): Promise<void> {
  // Delete in order to respect foreign key constraints
  await prisma.todo.deleteMany();
  await prisma.category.deleteMany();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

// Bulk insert categories
export interface CategoryInput {
  name: string;
}

export async function bulkInsertCategories(
  data: CategoryInput[]
): Promise<Category[]> {
  const categories: Category[] = [];

  for (const item of data) {
    const category = await prisma.category.create({
      data: { name: item.name },
    });
    categories.push(category);
  }

  return categories;
}

// Bulk insert todos
export interface TodoInput {
  title: string;
  description?: string | null;
  dueDate?: Date | null;
  completed?: boolean;
  categoryId?: number | null;
}

export async function bulkInsertTodos(data: TodoInput[]): Promise<Todo[]> {
  const todos: Todo[] = [];

  for (const item of data) {
    const todo = await prisma.todo.create({
      data: {
        title: item.title,
        description: item.description ?? null,
        dueDate: item.dueDate ?? null,
        completed: item.completed ?? false,
        categoryId: item.categoryId ?? null,
      },
    });
    todos.push(todo);
  }

  return todos;
}

// Verification helpers
export async function verifyTodoExists(id: number): Promise<Todo | null> {
  return prisma.todo.findUnique({
    where: { id },
    include: { category: true },
  });
}

export async function verifyTodoDeleted(id: number): Promise<boolean> {
  const todo = await prisma.todo.findUnique({ where: { id } });
  return todo === null;
}

export async function verifyCategoryExists(id: number): Promise<Category | null> {
  return prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { todos: true } } },
  });
}

export async function getTodoCount(): Promise<number> {
  return prisma.todo.count();
}

export async function getCategoryCount(): Promise<number> {
  return prisma.category.count();
}

export async function getTodosByCategory(
  categoryId: number | null
): Promise<Todo[]> {
  return prisma.todo.findMany({
    where: { categoryId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getCompletedTodos(): Promise<Todo[]> {
  return prisma.todo.findMany({
    where: { completed: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getActiveTodos(): Promise<Todo[]> {
  return prisma.todo.findMany({
    where: { completed: false },
    orderBy: { createdAt: 'desc' },
  });
}
