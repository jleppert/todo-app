import type { WebDriver } from 'selenium-webdriver';
import type { ChildProcess } from 'child_process';
import { startServer, stopServer } from '../setup/testServer.ts';
import { createDriver, quitDriver } from '../setup/testDriver.ts';
import {
  clearDatabase,
  disconnectDatabase,
  prisma,
} from '../setup/testDatabase.ts';
import { seedSimpleList } from '../scenarios/index.ts';
import { createFakeTodo, createTodoWithTitle } from '../factories/index.ts';
import {
  navigateToApp,
  waitForAppLoad,
  createTodo,
  toggleTodoCompletion,
  deleteTodo,
  refreshPage,
} from '../helpers/actions.ts';
import {
  assertTodoVisible,
  assertTodoNotVisible,
  assertTodoCompleted,
  assertTodoActive,
  assertTodoInDatabase,
  assertTodoNotInDatabase,
  assertDatabaseTodoCount,
  assertTodoCount,
  assertEmptyStateVisible,
} from '../helpers/assertions.ts';

describe('Todo CRUD Integration', () => {
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

  describe('Create Todo', () => {
    it('should create a todo with faker data and verify in database', async () => {
      // Arrange
      await navigateToApp(driver);
      await waitForAppLoad(driver);

      const todoData = createTodoWithTitle('Buy groceries for the week');

      // Act: Create todo via UI
      await createTodo(driver, {
        title: todoData.title,
        description: todoData.description ?? undefined,
      });

      // Wait for todo to appear
      await driver.sleep(1000);

      // Assert: Verify in database
      const dbTodo = await prisma.todo.findFirst({
        where: { title: todoData.title },
      });

      expect(dbTodo).not.toBeNull();
      expect(dbTodo?.title).toBe(todoData.title);
      expect(dbTodo?.completed).toBe(false);
    }, 30000);

    it('should create todo with all fields and persist correctly', async () => {
      // Arrange
      await navigateToApp(driver);
      await waitForAppLoad(driver);

      const title = 'Complete quarterly report';
      const description = 'Include all sales figures and projections';

      // Act
      await createTodo(driver, { title, description });
      await driver.sleep(1000);

      // Assert database
      const dbTodo = await prisma.todo.findFirst({
        where: { title },
      });

      expect(dbTodo).not.toBeNull();
      expect(dbTodo?.title).toBe(title);
      expect(dbTodo?.description).toBe(description);
      expect(dbTodo?.completed).toBe(false);
    }, 30000);

    it('should increment todo count after creation', async () => {
      // Arrange
      await seedSimpleList();
      await navigateToApp(driver);
      await waitForAppLoad(driver);

      const initialCount = await prisma.todo.count();

      // Act
      await createTodo(driver, { title: 'New Task' });
      await driver.sleep(1000);

      // Assert
      const finalCount = await prisma.todo.count();
      expect(finalCount).toBe(initialCount + 1);
    }, 30000);
  });

  describe('Toggle Completion', () => {
    it('should toggle todo completion and verify database state', async () => {
      // Arrange: Seed data
      const { todos } = await seedSimpleList();
      const todoToToggle = todos.find((t) => !t.completed);

      if (!todoToToggle) {
        throw new Error('No active todo found to toggle');
      }

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Assert initial state
      await assertTodoInDatabase(todoToToggle.id, { completed: false });

      // Act: Toggle completion
      await toggleTodoCompletion(driver, todoToToggle.id);
      await driver.sleep(500);

      // Assert: Verify database updated
      await assertTodoInDatabase(todoToToggle.id, { completed: true });
    }, 30000);

    it('should show completed styling in UI after toggle', async () => {
      // Arrange
      const { todos } = await seedSimpleList();
      const todoToToggle = todos.find((t) => !t.completed);

      if (!todoToToggle) {
        throw new Error('No active todo found to toggle');
      }

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Act
      await toggleTodoCompletion(driver, todoToToggle.id);
      await driver.sleep(500);

      // Assert: UI shows completed
      await assertTodoCompleted(driver, todoToToggle.id);
    }, 30000);

    it('should toggle completed todo back to active', async () => {
      // Arrange
      const { todos } = await seedSimpleList();
      const completedTodo = todos.find((t) => t.completed);

      if (!completedTodo) {
        // Create a completed todo if none exists
        const todo = await prisma.todo.create({
          data: { title: 'Completed Task', completed: true },
        });
        await navigateToApp(driver);
        await waitForAppLoad(driver);
        await toggleTodoCompletion(driver, todo.id);
        await driver.sleep(500);
        await assertTodoInDatabase(todo.id, { completed: false });
        return;
      }

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Act
      await toggleTodoCompletion(driver, completedTodo.id);
      await driver.sleep(500);

      // Assert
      await assertTodoInDatabase(completedTodo.id, { completed: false });
    }, 30000);
  });

  describe('Delete Todo', () => {
    it('should delete todo and verify removal from database', async () => {
      // Arrange
      const { todos } = await seedSimpleList();
      const todoToDelete = todos[0];

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Assert: Todo exists initially
      await assertTodoVisible(driver, todoToDelete.id);
      await assertTodoInDatabase(todoToDelete.id, {});

      // Act: Delete via UI
      await deleteTodo(driver, todoToDelete.id);
      await driver.sleep(1000);

      // Assert: Removed from both UI and database
      await assertTodoNotVisible(driver, todoToDelete.id);
      await assertTodoNotInDatabase(todoToDelete.id);
    }, 30000);

    it('should decrement todo count after deletion', async () => {
      // Arrange
      const { todos } = await seedSimpleList();
      const todoToDelete = todos[0];

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      const initialCount = await prisma.todo.count();

      // Act
      await deleteTodo(driver, todoToDelete.id);
      await driver.sleep(1000);

      // Assert
      const finalCount = await prisma.todo.count();
      expect(finalCount).toBe(initialCount - 1);
    }, 30000);

    it('should show empty state after deleting all todos', async () => {
      // Arrange: Create a single todo
      const todo = await prisma.todo.create({
        data: { title: 'Only Todo' },
      });

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Act: Delete the only todo
      await deleteTodo(driver, todo.id);
      await driver.sleep(1000);

      // Assert: Empty state visible
      await assertEmptyStateVisible(driver);
      await assertDatabaseTodoCount(0);
    }, 30000);
  });

  describe('Data Persistence', () => {
    it('should persist todo after page refresh', async () => {
      // Arrange
      await navigateToApp(driver);
      await waitForAppLoad(driver);

      const title = 'Persistent Task';

      // Act: Create and refresh
      await createTodo(driver, { title });
      await driver.sleep(1000);

      const todoBeforeRefresh = await prisma.todo.findFirst({
        where: { title },
      });

      await refreshPage(driver);

      // Assert: Todo still exists after refresh
      const todoAfterRefresh = await prisma.todo.findFirst({
        where: { title },
      });

      expect(todoAfterRefresh).not.toBeNull();
      expect(todoAfterRefresh?.id).toBe(todoBeforeRefresh?.id);
    }, 30000);

    it('should maintain toggle state after page refresh', async () => {
      // Arrange
      const todo = await prisma.todo.create({
        data: { title: 'Toggle Test', completed: false },
      });

      await navigateToApp(driver);
      await waitForAppLoad(driver);

      // Act: Toggle and refresh
      await toggleTodoCompletion(driver, todo.id);
      await driver.sleep(500);
      await refreshPage(driver);

      // Assert: Toggle state persisted
      await assertTodoInDatabase(todo.id, { completed: true });
    }, 30000);
  });
});
