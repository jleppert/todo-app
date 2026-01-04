import {
  clearDatabase,
  bulkInsertCategories,
  bulkInsertTodos,
} from '../setup/testDatabase.ts';
import { createFakeCategories, createFakeTodos } from '../factories/index.ts';
import type { ScenarioResult } from './types.ts';

/**
 * With Categories Scenario
 * - 3 categories
 * - 12 todos distributed across categories (some uncategorized)
 *
 * Use for testing category filtering and grouping
 */
export async function seedWithCategories(): Promise<ScenarioResult> {
  await clearDatabase();

  // Create 3 categories
  const categoryInputs = createFakeCategories(3);
  const categories = await bulkInsertCategories(categoryInputs);

  // Create 12 todos distributed across categories
  const categoryIds = categories.map((c) => c.id);
  const todoInputs = createFakeTodos(12, categoryIds);

  // Ensure at least 2 todos are uncategorized
  todoInputs[0].categoryId = null;
  todoInputs[1].categoryId = null;

  // Ensure each category has at least 2 todos
  todoInputs[2].categoryId = categoryIds[0];
  todoInputs[3].categoryId = categoryIds[0];
  todoInputs[4].categoryId = categoryIds[1];
  todoInputs[5].categoryId = categoryIds[1];
  todoInputs[6].categoryId = categoryIds[2];
  todoInputs[7].categoryId = categoryIds[2];

  const todos = await bulkInsertTodos(todoInputs);

  return {
    categories,
    todos,
  };
}
