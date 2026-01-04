import type { Category, Todo } from '../../../../src/generated/prisma/client.js';

export interface ScenarioResult {
  categories: Category[];
  todos: Todo[];
}

export type ScenarioSeed = () => Promise<ScenarioResult>;
