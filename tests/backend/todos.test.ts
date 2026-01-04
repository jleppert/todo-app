import request from 'supertest';
import { app } from '../../src/backend/server';
import { clearDatabase, seedTestData, prisma } from './testDb';

describe('Todos API', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await clearDatabase();
    await prisma.$disconnect();
  });

  describe('GET /api/todos', () => {
    it('should return empty array when no todos exist', async () => {
      const response = await request(app).get('/api/todos');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: [] });
    });

    it('should return all todos with category info', async () => {
      await seedTestData();

      const response = await request(app).get('/api/todos');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);

      // Check that category info is included
      const workTodo = response.body.data.find(
        (t: { title: string }) => t.title === 'Complete project'
      );
      expect(workTodo.category).toEqual({ id: expect.any(Number), name: 'Work' });
    });

    it('should filter by active status', async () => {
      await seedTestData();

      const response = await request(app).get('/api/todos?status=active');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      response.body.data.forEach((todo: { completed: boolean }) => {
        expect(todo.completed).toBe(false);
      });
    });

    it('should filter by completed status', async () => {
      await seedTestData();

      const response = await request(app).get('/api/todos?status=completed');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].completed).toBe(true);
    });

    it('should filter by categoryId', async () => {
      const { categories } = await seedTestData();

      const response = await request(app).get(
        `/api/todos?categoryId=${categories.work.id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Complete project');
    });

    it('should filter by null categoryId for uncategorized', async () => {
      await seedTestData();

      const response = await request(app).get('/api/todos?categoryId=null');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Uncategorized task');
    });

    it('should sort by createdAt descending by default', async () => {
      await seedTestData();

      const response = await request(app).get('/api/todos');

      expect(response.status).toBe(200);
      // Last created should be first
      expect(response.body.data[0].title).toBe('Uncategorized task');
    });

    it('should sort by dueDate ascending', async () => {
      const category = await prisma.category.create({ data: { name: 'Test' } });
      await prisma.todo.create({
        data: { title: 'Later', dueDate: new Date('2024-12-31'), categoryId: category.id },
      });
      await prisma.todo.create({
        data: { title: 'Sooner', dueDate: new Date('2024-01-01'), categoryId: category.id },
      });

      const response = await request(app).get(
        '/api/todos?sortBy=dueDate&sortOrder=asc'
      );

      expect(response.status).toBe(200);
      expect(response.body.data[0].title).toBe('Sooner');
    });

    it('should group by category when requested', async () => {
      await seedTestData();

      const response = await request(app).get('/api/todos?groupByCategory=true');

      expect(response.status).toBe(200);
      expect(response.body.data.grouped).toBeDefined();
      expect(Array.isArray(response.body.data.grouped)).toBe(true);

      // Should have categories plus uncategorized
      const groups = response.body.data.grouped;
      const uncategorizedGroup = groups.find(
        (g: { category: null | { name: string } }) => g.category === null
      );
      expect(uncategorizedGroup).toBeDefined();
      expect(uncategorizedGroup.todos).toHaveLength(1);
    });
  });

  describe('GET /api/todos/:id', () => {
    it('should return a single todo', async () => {
      const { todos } = await seedTestData();

      const response = await request(app).get(`/api/todos/${todos.todo1.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Complete project');
      expect(response.body.data.category).toEqual({ id: expect.any(Number), name: 'Work' });
    });

    it('should return not found for non-existent todo', async () => {
      const response = await request(app).get('/api/todos/99999');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return validation error for invalid ID', async () => {
      const response = await request(app).get('/api/todos/invalid');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/todos', () => {
    it('should create a todo with minimal fields', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ title: 'New Task' });

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        title: 'New Task',
        description: null,
        dueDate: null,
        completed: false,
        categoryId: null,
        category: null,
      });
    });

    it('should create a todo with all fields', async () => {
      const category = await prisma.category.create({ data: { name: 'Work' } });
      const dueDate = '2024-12-31T00:00:00.000Z';

      const response = await request(app)
        .post('/api/todos')
        .send({
          title: 'Complete project',
          description: 'Finish the todo app',
          dueDate,
          categoryId: category.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        title: 'Complete project',
        description: 'Finish the todo app',
        dueDate,
        completed: false,
        categoryId: category.id,
        category: { id: category.id, name: 'Work' },
      });
    });

    it('should return validation error for missing title', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ description: 'No title' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toContainEqual(
        expect.objectContaining({ field: 'title' })
      );
    });

    it('should return validation error for title exceeding 200 characters', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ title: 'a'.repeat(201) });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for invalid due date format', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ title: 'Test', dueDate: 'not-a-date' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return not found for non-existent category', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ title: 'Test', categoryId: 99999 });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/todos/:id', () => {
    it('should update a todo', async () => {
      const { todos, categories } = await seedTestData();

      const response = await request(app)
        .put(`/api/todos/${todos.todo1.id}`)
        .send({
          title: 'Updated title',
          description: 'Updated description',
          categoryId: categories.personal.id,
          completed: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        title: 'Updated title',
        description: 'Updated description',
        completed: true,
        category: { id: categories.personal.id, name: 'Personal' },
      });
    });

    it('should allow setting fields to null', async () => {
      const category = await prisma.category.create({ data: { name: 'Work' } });
      const todo = await prisma.todo.create({
        data: {
          title: 'Test',
          description: 'Has description',
          dueDate: new Date(),
          categoryId: category.id,
        },
      });

      const response = await request(app)
        .put(`/api/todos/${todo.id}`)
        .send({
          title: 'Test',
          description: null,
          dueDate: null,
          categoryId: null,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.description).toBeNull();
      expect(response.body.data.dueDate).toBeNull();
      expect(response.body.data.categoryId).toBeNull();
    });

    it('should return not found for non-existent todo', async () => {
      const response = await request(app)
        .put('/api/todos/99999')
        .send({ title: 'Test' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return not found for non-existent category', async () => {
      const { todos } = await seedTestData();

      const response = await request(app)
        .put(`/api/todos/${todos.todo1.id}`)
        .send({ title: 'Test', categoryId: 99999 });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('should delete a todo', async () => {
      const { todos } = await seedTestData();

      const response = await request(app).delete(`/api/todos/${todos.todo1.id}`);

      expect(response.status).toBe(204);

      const deleted = await prisma.todo.findUnique({
        where: { id: todos.todo1.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return not found for non-existent todo', async () => {
      const response = await request(app).delete('/api/todos/99999');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/todos/:id/toggle', () => {
    it('should toggle incomplete to complete', async () => {
      const todo = await prisma.todo.create({
        data: { title: 'Test', completed: false },
      });

      const response = await request(app).patch(`/api/todos/${todo.id}/toggle`);

      expect(response.status).toBe(200);
      expect(response.body.data.completed).toBe(true);
    });

    it('should toggle complete to incomplete', async () => {
      const todo = await prisma.todo.create({
        data: { title: 'Test', completed: true },
      });

      const response = await request(app).patch(`/api/todos/${todo.id}/toggle`);

      expect(response.status).toBe(200);
      expect(response.body.data.completed).toBe(false);
    });

    it('should return not found for non-existent todo', async () => {
      const response = await request(app).patch('/api/todos/99999/toggle');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should update the updatedAt timestamp', async () => {
      const todo = await prisma.todo.create({
        data: { title: 'Test', completed: false },
      });

      // Small delay to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = await request(app).patch(`/api/todos/${todo.id}/toggle`);

      expect(response.status).toBe(200);
      expect(new Date(response.body.data.updatedAt).getTime()).toBeGreaterThan(
        todo.updatedAt.getTime()
      );
    });
  });
});
