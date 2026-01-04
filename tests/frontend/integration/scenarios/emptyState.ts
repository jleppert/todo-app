import { clearDatabase } from '../setup/testDatabase.ts';
import type { ScenarioResult } from './types.ts';

/**
 * Empty State Scenario
 * - 0 categories
 * - 0 todos
 *
 * Use for testing empty state UI
 */
export async function seedEmptyState(): Promise<ScenarioResult> {
  await clearDatabase();

  return {
    categories: [],
    todos: [],
  };
}
