import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../db/client.ts';
import { createCategorySchema, updateCategorySchema } from '../validation/schemas.ts';
import { AppError, asyncHandler } from '../middleware/errorHandler.ts';

const categoriesRouter = Router();

// Response types
interface CategoryResponse {
  id: number;
  name: string;
  todoCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryListResponse {
  data: CategoryResponse[];
}

interface SingleCategoryResponse {
  data: CategoryResponse;
}

// Helper to format category response
function formatCategory(
  category: { id: number; name: string; createdAt: Date; updatedAt: Date },
  todoCount: number
): CategoryResponse {
  return {
    id: category.id,
    name: category.name,
    todoCount,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

// GET /api/categories - List all categories
categoriesRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response<CategoryListResponse>) => {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { todos: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const data = categories.map((cat) =>
      formatCategory(cat, cat._count.todos)
    );

    res.json({ data });
  })
);

// POST /api/categories - Create category
categoriesRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response<SingleCategoryResponse>) => {
    const validated = createCategorySchema.parse(req.body);

    const category = await prisma.category.create({
      data: {
        name: validated.name,
      },
    });

    res.status(201).json({
      data: formatCategory(category, 0),
    });
  })
);

// PUT /api/categories/:id - Update category
categoriesRouter.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response<SingleCategoryResponse>) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw AppError.validation('Invalid category ID', [
        { field: 'id', message: 'ID must be a number' },
      ]);
    }

    const validated = updateCategorySchema.parse(req.body);

    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { todos: true } } },
    });

    if (!existing) {
      throw AppError.notFound('Category not found');
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: validated.name,
      },
      include: { _count: { select: { todos: true } } },
    });

    res.json({
      data: formatCategory(category, category._count.todos),
    });
  })
);

// DELETE /api/categories/:id - Delete category
categoriesRouter.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw AppError.validation('Invalid category ID', [
        { field: 'id', message: 'ID must be a number' },
      ]);
    }

    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw AppError.notFound('Category not found');
    }

    await prisma.category.delete({
      where: { id },
    });

    res.status(204).send();
  })
);

export { categoriesRouter };
