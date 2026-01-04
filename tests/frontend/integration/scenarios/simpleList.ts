import { clearDatabase, bulkInsertTodos } from '../setup/testDatabase.ts';
import { createFakeTodos } from '../factories/index.ts';
import type { ScenarioResult } from './types.ts';

/**
 * Simple List Scenario
 * - 0 categories
 * - 5 todos (no category assignments)
 *
 * Use for basic CRUD testing without category complexity
 */
export async function seedSimpleList(): Promise<ScenarioResult> {
  await clearDatabase();

  const todoInputs = createFakeTodos(5);
  const todos = await bulkInsertTodos(todoInputs);

  return {
    categories: [],
    todos,
  };
}
