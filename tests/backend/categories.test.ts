import request from 'supertest';
import { app } from '../../src/backend/server';
import { clearDatabase, seedTestData, prisma } from './testDb';

describe('Categories API', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await clearDatabase();
    await prisma.$disconnect();
  });

  describe('GET /api/categories', () => {
    it('should return empty array when no categories exist', async () => {
      const response = await request(app).get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: [] });
    });

    it('should return all categories with todo count', async () => {
      const { categories } = await seedTestData();

      const response = await request(app).get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);

      // Should be sorted by name
      expect(response.body.data[0].name).toBe('Personal');
      expect(response.body.data[0].todoCount).toBe(1);
      expect(response.body.data[1].name).toBe('Work');
      expect(response.body.data[1].todoCount).toBe(1);
    });

    it('should include timestamps in ISO format', async () => {
      await prisma.category.create({ data: { name: 'Test' } });

      const response = await request(app).get('/api/categories');

      expect(response.body.data[0]).toHaveProperty('createdAt');
      expect(response.body.data[0]).toHaveProperty('updatedAt');
      expect(new Date(response.body.data[0].createdAt).toISOString()).toBe(
        response.body.data[0].createdAt
      );
    });
  });

  describe('POST /api/categories', () => {
    it('should create a new category', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({ name: 'Work' });

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        name: 'Work',
        todoCount: 0,
      });
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
    });

    it('should trim whitespace from name', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({ name: '  Work  ' });

      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe('Work');
    });

    it('should return validation error for missing name', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toContainEqual(
        expect.objectContaining({ field: 'name' })
      );
    });

    it('should return validation error for empty name', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({ name: '' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for name exceeding 50 characters', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({ name: 'a'.repeat(51) });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return conflict error for duplicate name', async () => {
      await prisma.category.create({ data: { name: 'Work' } });

      const response = await request(app)
        .post('/api/categories')
        .send({ name: 'Work' });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('CONFLICT');
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update an existing category', async () => {
      const category = await prisma.category.create({ data: { name: 'Work' } });

      const response = await request(app)
        .put(`/api/categories/${category.id}`)
        .send({ name: 'Personal' });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Personal');
      expect(response.body.data.id).toBe(category.id);
    });

    it('should return not found for non-existent category', async () => {
      const response = await request(app)
        .put('/api/categories/99999')
        .send({ name: 'Personal' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return validation error for invalid ID', async () => {
      const response = await request(app)
        .put('/api/categories/invalid')
        .send({ name: 'Personal' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return conflict error when updating to duplicate name', async () => {
      await prisma.category.create({ data: { name: 'Work' } });
      const personal = await prisma.category.create({ data: { name: 'Personal' } });

      const response = await request(app)
        .put(`/api/categories/${personal.id}`)
        .send({ name: 'Work' });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('CONFLICT');
    });

    it('should preserve todo count after update', async () => {
      const { categories } = await seedTestData();

      const response = await request(app)
        .put(`/api/categories/${categories.work.id}`)
        .send({ name: 'Updated Work' });

      expect(response.status).toBe(200);
      expect(response.body.data.todoCount).toBe(1);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete an existing category', async () => {
      const category = await prisma.category.create({ data: { name: 'Work' } });

      const response = await request(app)
        .delete(`/api/categories/${category.id}`);

      expect(response.status).toBe(204);

      // Verify deletion
      const deleted = await prisma.category.findUnique({
        where: { id: category.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return not found for non-existent category', async () => {
      const response = await request(app)
        .delete('/api/categories/99999');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should set categoryId to null for associated todos', async () => {
      const { categories, todos } = await seedTestData();

      await request(app).delete(`/api/categories/${categories.work.id}`);

      const todo = await prisma.todo.findUnique({
        where: { id: todos.todo1.id },
      });
      expect(todo?.categoryId).toBeNull();
    });
  });
});
