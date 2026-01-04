import { faker } from '@faker-js/faker';
import { clearDatabase, bulkInsertTodos } from '../setup/testDatabase.ts';
import {
  createOverdueTodo,
  createActiveTodo,
  createFakeTodo,
} from '../factories/index.ts';
import type { ScenarioResult } from './types.ts';

/**
 * Overdue Items Scenario
 * - 0 categories
 * - 4 todos: 2 overdue, 1 due today, 1 due in future
 *
 * Use for testing overdue styling and date sorting
 */
export async function seedOverdueItems(): Promise<ScenarioResult> {
  await clearDatabase();

  // Get dates for testing
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);

  const todoInputs = [
    // 2 overdue todos
    createOverdueTodo({ title: 'Overdue Task 1' }),
    createOverdueTodo({ title: 'Overdue Task 2' }),
    // 1 todo due today
    createActiveTodo({ title: 'Due Today', dueDate: today }),
    // 1 todo due in the future
    createFakeTodo({
      title: 'Future Task',
      dueDate: faker.date.future(),
      completed: false,
    }),
  ];

  const todos = await bulkInsertTodos(todoInputs);

  return {
    categories: [],
    todos,
  };
}
