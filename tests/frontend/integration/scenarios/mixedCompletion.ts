import {
  clearDatabase,
  bulkInsertCategories,
  bulkInsertTodos,
} from '../setup/testDatabase.ts';
import {
  createFakeCategory,
  createActiveTodo,
  createCompletedTodo,
} from '../factories/index.ts';
import type { ScenarioResult } from './types.ts';

/**
 * Mixed Completion Scenario
 * - 1 category
 * - 5 todos: 3 active, 2 completed
 *
 * Use for testing status filtering (all/active/completed)
 */
export async function seedMixedCompletion(): Promise<ScenarioResult> {
  await clearDatabase();

  // Create 1 category
  const categoryInput = createFakeCategory({ name: 'Tasks' });
  const categories = await bulkInsertCategories([categoryInput]);
  const categoryId = categories[0].id;

  // Create 3 active todos
  const activeTodos = [
    createActiveTodo({ categoryId }),
    createActiveTodo({ categoryId }),
    createActiveTodo({ categoryId }),
  ];

  // Create 2 completed todos
  const completedTodos = [
    createCompletedTodo({ categoryId }),
    createCompletedTodo({ categoryId }),
  ];

  const todos = await bulkInsertTodos([...activeTodos, ...completedTodos]);

  return {
    categories,
    todos,
  };
}
