import { z } from 'zod';

// Category schemas
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be at most 50 characters')
    .trim(),
});

export const updateCategorySchema = createCategorySchema;

// Todo schemas
export const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters')
    .trim(),
  description: z
    .string()
    .max(2000, 'Description must be at most 2000 characters')
    .trim()
    .optional()
    .nullable(),
  dueDate: z
    .string()
    .datetime({ message: 'Due date must be a valid ISO 8601 date' })
    .optional()
    .nullable(),
  categoryId: z.number().int().positive().optional().nullable(),
});

export const updateTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters')
    .trim(),
  description: z
    .string()
    .max(2000, 'Description must be at most 2000 characters')
    .trim()
    .optional()
    .nullable(),
  dueDate: z
    .string()
    .datetime({ message: 'Due date must be a valid ISO 8601 date' })
    .optional()
    .nullable(),
  categoryId: z.number().int().positive().optional().nullable(),
  completed: z.boolean().optional(),
});

// Query params schema for listing todos
export const listTodosQuerySchema = z.object({
  status: z.enum(['all', 'active', 'completed']).default('all'),
  categoryId: z
    .string()
    .transform((val) => (val === 'null' ? null : parseInt(val, 10)))
    .pipe(z.number().int().positive().nullable())
    .optional(),
  sortBy: z.enum(['createdAt', 'dueDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  groupByCategory: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
});

// Type exports
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
export type ListTodosQuery = z.infer<typeof listTodosQuerySchema>;
