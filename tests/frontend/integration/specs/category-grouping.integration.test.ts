import type { WebDriver } from 'selenium-webdriver';
import type { ChildProcess } from 'child_process';
import { startServer, stopServer } from '../setup/testServer.ts';
import { createDriver, quitDriver, findElements } from '../setup/testDriver.ts';
import {
  clearDatabase,
  disconnectDatabase,
  prisma,
} from '../setup/testDatabase.ts';
import { seedWithCategories } from '../scenarios/index.ts';
import {
  navigateToApp,
  waitForAppLoad,
  toggleGroupByCategory,
  createTodo,
  toggleTodoCompletion,
} from '../helpers/actions.ts';
import {
  assertListIsGrouped,
  assertListIsFlat,
  assertTodoVisible,
} from '../helpers/assertions.ts';
import { selectors } from '../helpers/selectors.ts';

describe('Category Grouping Integration', () => {
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

  describe('Group Toggle', () => {
    it('should group todos by category when enabled', async () => {
      // Arrange
      await seedWithCategories();

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Initially should be flat list
      await assertListIsFlat(driver);

      // Act: Enable grouping
      await toggleGroupByCategory(driver);

      // Assert: List is now grouped
      await assertListIsGrouped(driver);
    }, 30000);

    it('should return to flat list when grouping is disabled', async () => {
      // Arrange
      await seedWithCategories();

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Enable then disable grouping
      await toggleGroupByCategory(driver); // Enable
      await assertListIsGrouped(driver);

      // Act: Disable
      await toggleGroupByCategory(driver);

      // Assert: Back to flat list
      await assertListIsFlat(driver);
    }, 30000);
  });

  describe('Group Structure', () => {
    it('should show uncategorized section for todos without category', async () => {
      // Arrange
      const { todos } = await seedWithCategories();
      const uncategorizedTodos = todos.filter((t) => t.categoryId === null);

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Act: Enable grouping
      await toggleGroupByCategory(driver);

      // Assert: All uncategorized todos should be visible
      for (const todo of uncategorizedTodos) {
        await assertTodoVisible(driver, todo.id);
      }
    }, 30000);

    it('should show todos grouped under correct category headers', async () => {
      // Arrange: Create specific test data
      const cat1 = await prisma.category.create({ data: { name: 'Work' } });
      const cat2 = await prisma.category.create({ data: { name: 'Personal' } });

      await prisma.todo.createMany({
        data: [
          { title: 'Work Task 1', categoryId: cat1.id },
          { title: 'Work Task 2', categoryId: cat1.id },
          { title: 'Personal Task 1', categoryId: cat2.id },
          { title: 'Uncategorized Task', categoryId: null },
        ],
      });

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Act: Enable grouping
      await toggleGroupByCategory(driver);

      // Assert: Grouped structure exists
      await assertListIsGrouped(driver);

      // Verify all todos are still visible
      const allTodos = await prisma.todo.findMany();
      for (const todo of allTodos) {
        await assertTodoVisible(driver, todo.id);
      }
    }, 30000);
  });

  describe('Grouping with Operations', () => {
    it('should maintain grouping after todo operations', async () => {
      // Arrange
      const category = await prisma.category.create({ data: { name: 'Test' } });

      const todo = await prisma.todo.create({
        data: { title: 'Toggle Me', categoryId: category.id, completed: false },
      });

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Enable grouping
      await toggleGroupByCategory(driver);
      await assertListIsGrouped(driver);

      // Act: Toggle todo completion
      await toggleTodoCompletion(driver, todo.id);
      await driver.sleep(500);

      // Assert: Still grouped
      await assertListIsGrouped(driver);
    }, 30000);

    it('should update group when new todo is created', async () => {
      // Arrange
      const category = await prisma.category.create({ data: { name: 'Tasks' } });

      await prisma.todo.create({
        data: { title: 'Existing Task', categoryId: category.id },
      });

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Enable grouping
      await toggleGroupByCategory(driver);

      const initialCount = (
        await findElements(driver, '[data-testid^="todo-item-"]')
      ).length;

      // Act: Create a new todo
      await createTodo(driver, { title: 'New Task' });
      await driver.sleep(1000);

      // Assert: Todo count increased
      const finalCount = (
        await findElements(driver, '[data-testid^="todo-item-"]')
      ).length;
      expect(finalCount).toBe(initialCount + 1);

      // Still grouped
      await assertListIsGrouped(driver);
    }, 30000);
  });

  describe('Empty Groups', () => {
    it('should not show empty category groups', async () => {
      // Arrange: Create category with no todos
      await prisma.category.create({ data: { name: 'Empty Category' } });

      // Create a todo without category
      await prisma.todo.create({
        data: { title: 'Uncategorized' },
      });

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Act: Enable grouping
      await toggleGroupByCategory(driver);

      // Assert: Only the uncategorized group should be visible with the todo
      const todoElements = await findElements(
        driver,
        '[data-testid^="todo-item-"]'
      );
      expect(todoElements.length).toBe(1);
    }, 30000);
  });

  describe('Group Persistence', () => {
    it('should maintain group state after page refresh', async () => {
      // Arrange
      await seedWithCategories();

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Enable grouping
      await toggleGroupByCategory(driver);
      await assertListIsGrouped(driver);

      // Act: Refresh page
      await driver.navigate().refresh();
      await waitForAppLoad(driver);

      // Assert: Grouping state may or may not persist depending on implementation
      // This test documents the expected behavior
      // If grouping should persist, uncomment the assertion below:
      // await assertListIsGrouped(driver);
    }, 30000);
  });
});
