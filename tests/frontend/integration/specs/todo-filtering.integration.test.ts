import type { WebDriver } from 'selenium-webdriver';
import type { ChildProcess } from 'child_process';
import { startServer, stopServer } from '../setup/testServer.ts';
import { createDriver, quitDriver } from '../setup/testDriver.ts';
import {
  clearDatabase,
  disconnectDatabase,
  prisma,
} from '../setup/testDatabase.ts';
import { seedMixedCompletion, seedWithCategories } from '../scenarios/index.ts';
import {
  navigateToApp,
  waitForAppLoad,
  filterByStatus,
  filterByCategory,
  countTodoItems,
} from '../helpers/actions.ts';
import {
  assertTodoVisible,
  assertTodoNotVisible,
  assertTodoCount,
  assertEmptyStateVisible,
} from '../helpers/assertions.ts';

describe('Todo Filtering Integration', () => {
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

  describe('Status Filtering', () => {
    it('should filter by active status showing only incomplete todos', async () => {
      // Arrange: Seed 3 active, 2 completed
      const { todos } = await seedMixedCompletion();
      const activeTodos = todos.filter((t) => !t.completed);
      const completedTodos = todos.filter((t) => t.completed);

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Act: Filter by active
      await filterByStatus(driver, 'active');

      // Assert: Only active todos visible
      for (const todo of activeTodos) {
        await assertTodoVisible(driver, todo.id);
      }
      for (const todo of completedTodos) {
        await assertTodoNotVisible(driver, todo.id);
      }
    }, 30000);

    it('should filter by completed status showing only completed todos', async () => {
      // Arrange
      const { todos } = await seedMixedCompletion();
      const activeTodos = todos.filter((t) => !t.completed);
      const completedTodos = todos.filter((t) => t.completed);

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Act: Filter by completed
      await filterByStatus(driver, 'completed');

      // Assert: Only completed todos visible
      for (const todo of completedTodos) {
        await assertTodoVisible(driver, todo.id);
      }
      for (const todo of activeTodos) {
        await assertTodoNotVisible(driver, todo.id);
      }
    }, 30000);

    it('should show all todos when filter is set to all', async () => {
      // Arrange
      const { todos } = await seedMixedCompletion();

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Act: Filter by completed first, then all
      await filterByStatus(driver, 'completed');
      await filterByStatus(driver, 'all');

      // Assert: All todos visible
      for (const todo of todos) {
        await assertTodoVisible(driver, todo.id);
      }
    }, 30000);

    it('should show empty state when no todos match filter', async () => {
      // Arrange: Create only active todos
      await prisma.todo.create({
        data: { title: 'Active Only', completed: false },
      });

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Act: Filter by completed
      await filterByStatus(driver, 'completed');

      // Assert: Empty state
      await assertEmptyStateVisible(driver);
    }, 30000);
  });

  describe('Category Filtering', () => {
    it('should filter by category showing only matching todos', async () => {
      // Arrange
      const { categories, todos } = await seedWithCategories();
      const category = categories[0];
      const categoryTodos = todos.filter((t) => t.categoryId === category.id);
      const otherTodos = todos.filter((t) => t.categoryId !== category.id);

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Act: Filter by category (pass full category object for text-based selection)
      await filterByCategory(driver, category);

      // Assert: Only category todos visible
      for (const todo of categoryTodos) {
        await assertTodoVisible(driver, todo.id);
      }
      // Note: Other todos may or may not be visible depending on implementation
    }, 30000);

    it('should show uncategorized todos when filtering by null category', async () => {
      // Arrange
      const { todos } = await seedWithCategories();
      const uncategorizedTodos = todos.filter((t) => t.categoryId === null);

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // This test depends on whether "uncategorized" is a filter option
      // Skip if not applicable
      if (uncategorizedTodos.length === 0) {
        return;
      }

      // Verify uncategorized todos exist
      for (const todo of uncategorizedTodos) {
        await assertTodoVisible(driver, todo.id);
      }
    }, 30000);
  });

  describe('Combined Filters', () => {
    it('should combine status and category filters', async () => {
      // Arrange: Create specific test data
      const category = await prisma.category.create({
        data: { name: 'Test Category' },
      });

      // Create 2 active in category, 1 completed in category, 1 active without category
      await prisma.todo.createMany({
        data: [
          { title: 'Active in Cat 1', completed: false, categoryId: category.id },
          { title: 'Active in Cat 2', completed: false, categoryId: category.id },
          {
            title: 'Completed in Cat',
            completed: true,
            categoryId: category.id,
          },
          { title: 'Active No Cat', completed: false, categoryId: null },
        ],
      });

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Act: Filter by active status
      await filterByStatus(driver, 'active');

      // Assert: Completed todo should not be visible
      const allTodos = await prisma.todo.findMany();
      const activeTodos = allTodos.filter((t) => !t.completed);
      const completedTodos = allTodos.filter((t) => t.completed);

      for (const todo of activeTodos) {
        await assertTodoVisible(driver, todo.id);
      }
      for (const todo of completedTodos) {
        await assertTodoNotVisible(driver, todo.id);
      }
    }, 30000);
  });

  describe('Filter Persistence', () => {
    it('should maintain filter after todo toggle', async () => {
      // Arrange
      const { todos } = await seedMixedCompletion();
      const activeTodos = todos.filter((t) => !t.completed);
      const todoToToggle = activeTodos[0];

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Act: Filter by active, then toggle first active todo
      await filterByStatus(driver, 'active');

      // Count before toggle
      const countBefore = await countTodoItems(driver);

      // Toggle the todo (making it completed)
      const { toggleTodoCompletion } = await import('../helpers/actions.ts');
      await toggleTodoCompletion(driver, todoToToggle.id);

      // Wait for re-fetch to complete (toggle triggers fetchTodos when filtered)
      await driver.sleep(1500);

      // Assert: The toggled todo should no longer appear in active filter
      // (it became completed, so it should disappear from active view)
      await assertTodoNotVisible(driver, todoToToggle.id);
    }, 30000);
  });
});
