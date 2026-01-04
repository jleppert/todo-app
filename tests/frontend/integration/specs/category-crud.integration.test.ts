import type { WebDriver } from 'selenium-webdriver';
import type { ChildProcess } from 'child_process';
import { faker } from '@faker-js/faker';
import { startServer, stopServer } from '../setup/testServer.ts';
import { createDriver, quitDriver } from '../setup/testDriver.ts';
import {
  clearDatabase,
  disconnectDatabase,
  prisma,
} from '../setup/testDatabase.ts';
import { createFakeCategory } from '../factories/index.ts';
import {
  navigateToApp,
  waitForAppLoad,
  openCategoryManager,
  createCategory,
  deleteCategory,
} from '../helpers/actions.ts';
import {
  assertCategoryInDatabase,
  assertCategoryNotInDatabase,
  assertDatabaseCategoryCount,
} from '../helpers/assertions.ts';

describe('Category CRUD Integration', () => {
  let driver: WebDriver;
  let serverProcess: ChildProcess;

  beforeAll(async () => {
    serverProcess = await startServer();
    driver = await createDriver();
  }, 60000);

  afterAll(async () => {
    await quitDriver(driver);
    await stopServer(serverProcess);
    await disconnectDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Create Category', () => {
    it('should create a category with faker name and verify in database', async () => {
      // Arrange
      const categoryData = createFakeCategory();

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Act: Open category manager and create
      await openCategoryManager(driver);
      await createCategory(driver, categoryData.name);
      await driver.sleep(1000);

      // Assert: Verify in database
      const dbCategory = await prisma.category.findFirst({
        where: { name: categoryData.name },
      });

      expect(dbCategory).not.toBeNull();
      expect(dbCategory?.name).toBe(categoryData.name);
    }, 30000);

    it('should increment category count after creation', async () => {
      // Arrange
      await navigateToApp(driver);
      await waitForAppLoad(driver);

      const initialCount = await prisma.category.count();

      // Act
      await openCategoryManager(driver);
      await createCategory(driver, 'New Category');
      await driver.sleep(1000);

      // Assert
      const finalCount = await prisma.category.count();
      expect(finalCount).toBe(initialCount + 1);
    }, 30000);

    it('should handle creating multiple categories', async () => {
      // Arrange
      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Act: Create 3 categories
      await openCategoryManager(driver);
      await createCategory(driver, 'Category 1');
      await driver.sleep(500);
      await createCategory(driver, 'Category 2');
      await driver.sleep(500);
      await createCategory(driver, 'Category 3');
      await driver.sleep(500);

      // Assert
      await assertDatabaseCategoryCount(3);
    }, 45000);
  });

  describe('Delete Category', () => {
    it('should delete category and verify removal from database', async () => {
      // Arrange: Create a category first
      const category = await prisma.category.create({
        data: { name: 'To Delete' },
      });

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Act: Open manager and delete
      await openCategoryManager(driver);
      await deleteCategory(driver, category.id);
      await driver.sleep(1000);

      // Assert
      await assertCategoryNotInDatabase(category.id);
    }, 30000);

    it('should set categoryId to null for associated todos when category is deleted', async () => {
      // Arrange: Create category with a todo
      const category = await prisma.category.create({
        data: { name: 'With Todos' },
      });

      const todo = await prisma.todo.create({
        data: {
          title: 'Associated Todo',
          categoryId: category.id,
        },
      });

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Verify initial state
      const todoBeforeDelete = await prisma.todo.findUnique({
        where: { id: todo.id },
      });
      expect(todoBeforeDelete?.categoryId).toBe(category.id);

      // Act: Delete category
      await openCategoryManager(driver);
      await deleteCategory(driver, category.id);
      await driver.sleep(1000);

      // Assert: Todo still exists but categoryId is null
      const todoAfterDelete = await prisma.todo.findUnique({
        where: { id: todo.id },
      });

      expect(todoAfterDelete).not.toBeNull();
      expect(todoAfterDelete?.categoryId).toBeNull();
    }, 30000);

    it('should decrement category count after deletion', async () => {
      // Arrange
      await prisma.category.createMany({
        data: [{ name: 'Cat 1' }, { name: 'Cat 2' }, { name: 'Cat 3' }],
      });

      const categories = await prisma.category.findMany();
      const categoryToDelete = categories[0];

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      const initialCount = await prisma.category.count();

      // Act
      await openCategoryManager(driver);
      await deleteCategory(driver, categoryToDelete.id);
      await driver.sleep(1000);

      // Assert
      const finalCount = await prisma.category.count();
      expect(finalCount).toBe(initialCount - 1);
    }, 30000);
  });

  describe('Category Validation', () => {
    it('should prevent creating duplicate category names', async () => {
      // Arrange: Create initial category
      await prisma.category.create({
        data: { name: 'Existing Category' },
      });

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Act: Try to create duplicate
      await openCategoryManager(driver);
      await createCategory(driver, 'Existing Category');
      await driver.sleep(1000);

      // Assert: Still only 1 category (duplicate was rejected)
      const count = await prisma.category.count();
      expect(count).toBe(1);
    }, 30000);
  });

  describe('Category Persistence', () => {
    it('should persist category after page refresh', async () => {
      // Arrange
      await navigateToApp(driver);
      await waitForAppLoad(driver);

      const categoryName = `Test ${faker.string.uuid()}`;

      // Act: Create and refresh
      await openCategoryManager(driver);
      await createCategory(driver, categoryName);
      await driver.sleep(1000);

      const categoryBeforeRefresh = await prisma.category.findFirst({
        where: { name: categoryName },
      });

      await driver.navigate().refresh();
      await waitForAppLoad(driver);

      // Assert: Category still exists
      const categoryAfterRefresh = await prisma.category.findFirst({
        where: { name: categoryName },
      });

      expect(categoryAfterRefresh).not.toBeNull();
      expect(categoryAfterRefresh?.id).toBe(categoryBeforeRefresh?.id);
    }, 30000);
  });
});
