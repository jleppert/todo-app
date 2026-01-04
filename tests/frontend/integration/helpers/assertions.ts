import type { WebDriver } from 'selenium-webdriver';
import { By } from 'selenium-webdriver';
import type { Todo, Category } from '../../../../src/generated/prisma/client.js';
import {
  waitForElement,
  elementExists,
  findElements,
  getElementText,
} from '../setup/testDriver.ts';
import {
  verifyTodoExists,
  verifyTodoDeleted,
  verifyCategoryExists,
  getTodoCount,
  getCategoryCount,
} from '../setup/testDatabase.ts';
import { selectors } from './selectors.ts';

// ============================================================
// UI Assertions
// ============================================================

/**
 * Assert that a todo item is visible in the UI
 */
export async function assertTodoVisible(
  driver: WebDriver,
  todoId: number
): Promise<void> {
  const exists = await elementExists(driver, selectors.todoItem(todoId));
  if (!exists) {
    throw new Error(`Expected todo ${todoId} to be visible in UI`);
  }
}

/**
 * Assert that a todo item is NOT visible in the UI
 */
export async function assertTodoNotVisible(
  driver: WebDriver,
  todoId: number
): Promise<void> {
  const exists = await elementExists(driver, selectors.todoItem(todoId));
  if (exists) {
    throw new Error(`Expected todo ${todoId} to NOT be visible in UI`);
  }
}

/**
 * Assert that a todo shows completed styling
 */
export async function assertTodoCompleted(
  driver: WebDriver,
  todoId: number
): Promise<void> {
  const todoElement = await waitForElement(driver, selectors.todoItem(todoId));
  const classes = await todoElement.getAttribute('class');
  const html = await todoElement.getAttribute('innerHTML');

  // Check for line-through styling on the title
  if (!html.includes('line-through')) {
    throw new Error(`Expected todo ${todoId} to have completed styling`);
  }
}

/**
 * Assert that a todo shows active (not completed) styling
 */
export async function assertTodoActive(
  driver: WebDriver,
  todoId: number
): Promise<void> {
  const todoElement = await waitForElement(driver, selectors.todoItem(todoId));
  const html = await todoElement.getAttribute('innerHTML');

  // Check that there's no line-through styling
  if (html.includes('line-through')) {
    throw new Error(`Expected todo ${todoId} to NOT have completed styling`);
  }
}

/**
 * Assert the number of visible todo items
 */
export async function assertTodoCount(
  driver: WebDriver,
  expected: number
): Promise<void> {
  const elements = await findElements(driver, '[data-testid^="todo-item-"]');
  const actual = elements.length;

  if (actual !== expected) {
    throw new Error(`Expected ${expected} todos in UI, found ${actual}`);
  }
}

/**
 * Assert that empty state is visible
 */
export async function assertEmptyStateVisible(driver: WebDriver): Promise<void> {
  const exists = await elementExists(driver, selectors.emptyState);
  if (!exists) {
    throw new Error('Expected empty state to be visible');
  }
}

/**
 * Assert that empty state is NOT visible
 */
export async function assertEmptyStateNotVisible(
  driver: WebDriver
): Promise<void> {
  const exists = await elementExists(driver, selectors.emptyState);
  if (exists) {
    throw new Error('Expected empty state to NOT be visible');
  }
}

/**
 * Assert that a category is visible in the category manager
 */
export async function assertCategoryVisible(
  driver: WebDriver,
  categoryId: number
): Promise<void> {
  const exists = await elementExists(driver, selectors.categoryItem(categoryId));
  if (!exists) {
    throw new Error(`Expected category ${categoryId} to be visible in UI`);
  }
}

/**
 * Assert that a category is NOT visible in the category manager
 */
export async function assertCategoryNotVisible(
  driver: WebDriver,
  categoryId: number
): Promise<void> {
  const exists = await elementExists(driver, selectors.categoryItem(categoryId));
  if (exists) {
    throw new Error(`Expected category ${categoryId} to NOT be visible in UI`);
  }
}

/**
 * Assert that the todo list is grouped (by category)
 */
export async function assertListIsGrouped(driver: WebDriver): Promise<void> {
  const exists = await elementExists(driver, selectors.todoListGrouped);
  if (!exists) {
    throw new Error('Expected todo list to be grouped');
  }
}

/**
 * Assert that the todo list is NOT grouped (flat list)
 */
export async function assertListIsFlat(driver: WebDriver): Promise<void> {
  const exists = await elementExists(driver, selectors.todoList);
  const isGrouped = await elementExists(driver, selectors.todoListGrouped);

  if (isGrouped || !exists) {
    throw new Error('Expected todo list to be flat (not grouped)');
  }
}

/**
 * Assert todo has overdue styling
 */
export async function assertTodoOverdue(
  driver: WebDriver,
  todoId: number
): Promise<void> {
  const todoElement = await waitForElement(driver, selectors.todoItem(todoId));
  const html = await todoElement.getAttribute('innerHTML');

  // Check for destructive (red) styling on due date
  if (!html.includes('text-destructive')) {
    throw new Error(`Expected todo ${todoId} to have overdue styling`);
  }
}

// ============================================================
// Database Assertions
// ============================================================

/**
 * Assert that a todo exists in the database with expected values
 */
export async function assertTodoInDatabase(
  todoId: number,
  expected: Partial<Todo>
): Promise<void> {
  const todo = await verifyTodoExists(todoId);

  if (!todo) {
    throw new Error(`Expected todo ${todoId} to exist in database`);
  }

  // Check expected values
  for (const [key, value] of Object.entries(expected)) {
    const actualValue = todo[key as keyof Todo];

    // Handle Date comparison
    if (value instanceof Date) {
      const actualDate = actualValue as Date | null;
      if (!actualDate || actualDate.getTime() !== value.getTime()) {
        throw new Error(
          `Expected todo.${key} to be ${value.toISOString()}, got ${actualDate?.toISOString()}`
        );
      }
    } else if (actualValue !== value) {
      throw new Error(
        `Expected todo.${key} to be ${JSON.stringify(value)}, got ${JSON.stringify(actualValue)}`
      );
    }
  }
}

/**
 * Assert that a todo does NOT exist in the database
 */
export async function assertTodoNotInDatabase(todoId: number): Promise<void> {
  const deleted = await verifyTodoDeleted(todoId);

  if (!deleted) {
    throw new Error(`Expected todo ${todoId} to NOT exist in database`);
  }
}

/**
 * Assert that a category exists in the database with expected values
 */
export async function assertCategoryInDatabase(
  categoryId: number,
  expected: Partial<Category>
): Promise<void> {
  const category = await verifyCategoryExists(categoryId);

  if (!category) {
    throw new Error(`Expected category ${categoryId} to exist in database`);
  }

  // Check expected values
  for (const [key, value] of Object.entries(expected)) {
    const actualValue = category[key as keyof Category];
    if (actualValue !== value) {
      throw new Error(
        `Expected category.${key} to be ${JSON.stringify(value)}, got ${JSON.stringify(actualValue)}`
      );
    }
  }
}

/**
 * Assert that a category does NOT exist in the database
 */
export async function assertCategoryNotInDatabase(
  categoryId: number
): Promise<void> {
  const category = await verifyCategoryExists(categoryId);

  if (category) {
    throw new Error(`Expected category ${categoryId} to NOT exist in database`);
  }
}

/**
 * Assert the total number of todos in the database
 */
export async function assertDatabaseTodoCount(expected: number): Promise<void> {
  const actual = await getTodoCount();

  if (actual !== expected) {
    throw new Error(`Expected ${expected} todos in database, found ${actual}`);
  }
}

/**
 * Assert the total number of categories in the database
 */
export async function assertDatabaseCategoryCount(
  expected: number
): Promise<void> {
  const actual = await getCategoryCount();

  if (actual !== expected) {
    throw new Error(
      `Expected ${expected} categories in database, found ${actual}`
    );
  }
}

// ============================================================
// Combined UI + Database Assertions
// ============================================================

/**
 * Assert that a todo exists both in UI and database
 */
export async function assertTodoExistsEverywhere(
  driver: WebDriver,
  todoId: number,
  expected: Partial<Todo>
): Promise<void> {
  await assertTodoVisible(driver, todoId);
  await assertTodoInDatabase(todoId, expected);
}

/**
 * Assert that a todo is deleted from both UI and database
 */
export async function assertTodoDeletedEverywhere(
  driver: WebDriver,
  todoId: number
): Promise<void> {
  await assertTodoNotVisible(driver, todoId);
  await assertTodoNotInDatabase(todoId);
}

/**
 * Assert that a category exists both in UI and database
 */
export async function assertCategoryExistsEverywhere(
  driver: WebDriver,
  categoryId: number,
  expected: Partial<Category>
): Promise<void> {
  await assertCategoryVisible(driver, categoryId);
  await assertCategoryInDatabase(categoryId, expected);
}
