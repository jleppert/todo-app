import {
  clearDatabase,
  bulkInsertCategories,
  bulkInsertTodos,
} from '../setup/testDatabase.ts';
import { createFakeCategories, createFakeTodos } from '../factories/index.ts';
import type { ScenarioResult } from './types.ts';

/**
 * Large Dataset Scenario
 * - 10 categories
 * - 100 todos distributed across categories
 *
 * Use for performance/stress testing and scrolling behavior
 */
export async function seedLargeDataset(): Promise<ScenarioResult> {
  await clearDatabase();

  // Create 10 categories
  const categoryInputs = createFakeCategories(10);
  const categories = await bulkInsertCategories(categoryInputs);

  // Create 100 todos distributed across categories
  const categoryIds = categories.map((c) => c.id);
  const todoInputs = createFakeTodos(100, categoryIds);

  const todos = await bulkInsertTodos(todoInputs);

  return {
    categories,
    todos,
  };
}
