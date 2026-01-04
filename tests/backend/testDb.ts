import { prisma } from '../../src/backend/db/client.ts';

// Clear all data from the database before each test
export async function clearDatabase(): Promise<void> {
  // Delete in order to respect foreign key constraints
  await prisma.todo.deleteMany();
  await prisma.category.deleteMany();
}

// Seed some test data
export async function seedTestData(): Promise<{
  categories: { work: { id: number }; personal: { id: number } };
  todos: { todo1: { id: number }; todo2: { id: number }; todo3: { id: number } };
}> {
  const work = await prisma.category.create({ data: { name: 'Work' } });
  const personal = await prisma.category.create({ data: { name: 'Personal' } });

  const todo1 = await prisma.todo.create({
    data: {
      title: 'Complete project',
      description: 'Finish the todo app',
      categoryId: work.id,
      completed: false,
    },
  });

  const todo2 = await prisma.todo.create({
    data: {
      title: 'Buy groceries',
      categoryId: personal.id,
      completed: true,
    },
  });

  const todo3 = await prisma.todo.create({
    data: {
      title: 'Uncategorized task',
      completed: false,
    },
  });

  return {
    categories: { work, personal },
    todos: { todo1, todo2, todo3 },
  };
}

export { prisma };
