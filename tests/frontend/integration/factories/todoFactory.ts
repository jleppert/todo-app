import { faker } from '@faker-js/faker';

export interface TodoInput {
  title: string;
  description: string | null;
  dueDate: Date | null;
  completed: boolean;
  categoryId: number | null;
}

/**
 * Create a single fake todo with realistic data
 */
export function createFakeTodo(overrides?: Partial<TodoInput>): TodoInput {
  return {
    title: generateTodoTitle(),
    description: faker.helpers.maybe(() => faker.lorem.paragraph(), {
      probability: 0.7,
    }) ?? null,
    dueDate: faker.helpers.maybe(() => faker.date.future(), {
      probability: 0.5,
    }) ?? null,
    completed: faker.datatype.boolean({ probability: 0.3 }),
    categoryId: null,
    ...overrides,
  };
}

/**
 * Generate a realistic todo title
 */
function generateTodoTitle(): string {
  const titleGenerators = [
    () => faker.hacker.phrase(),
    () => `${faker.hacker.verb()} ${faker.hacker.noun()}`,
    () => faker.company.catchPhrase(),
    () => `Review ${faker.commerce.productName()}`,
    () => `Update ${faker.company.buzzNoun()}`,
    () => `Complete ${faker.commerce.product()} task`,
    () => `Schedule ${faker.word.noun()} meeting`,
    () => `Prepare ${faker.word.noun()} report`,
    () => `Fix ${faker.word.noun()} issue`,
    () => `Research ${faker.company.buzzNoun()}`,
  ];

  const generator = faker.helpers.arrayElement(titleGenerators);
  const title = generator();

  // Ensure title is within 200 character limit
  return title.length > 200 ? title.slice(0, 197) + '...' : title;
}

/**
 * Create multiple todos with optional category distribution
 */
export function createFakeTodos(
  count: number,
  categoryIds: number[] = []
): TodoInput[] {
  return Array.from({ length: count }, () =>
    createFakeTodo({
      categoryId:
        categoryIds.length > 0
          ? faker.helpers.maybe(
              () => faker.helpers.arrayElement(categoryIds),
              { probability: 0.7 }
            ) ?? null
          : null,
    })
  );
}

/**
 * Create an overdue todo (past due date, not completed)
 */
export function createOverdueTodo(overrides?: Partial<TodoInput>): TodoInput {
  return createFakeTodo({
    dueDate: faker.date.past({ years: 1 }),
    completed: false,
    ...overrides,
  });
}

/**
 * Create a completed todo
 */
export function createCompletedTodo(overrides?: Partial<TodoInput>): TodoInput {
  return createFakeTodo({
    completed: true,
    ...overrides,
  });
}

/**
 * Create an active (not completed) todo
 */
export function createActiveTodo(overrides?: Partial<TodoInput>): TodoInput {
  return createFakeTodo({
    completed: false,
    ...overrides,
  });
}

/**
 * Create an urgent todo (due within 24 hours)
 */
export function createUrgentTodo(overrides?: Partial<TodoInput>): TodoInput {
  return createFakeTodo({
    dueDate: faker.date.soon({ days: 1 }),
    completed: false,
    ...overrides,
  });
}

/**
 * Create a todo with a specific title (useful for tests that need to verify text)
 */
export function createTodoWithTitle(
  title: string,
  overrides?: Partial<TodoInput>
): TodoInput {
  return createFakeTodo({
    title,
    ...overrides,
  });
}

/**
 * Create a todo with all fields populated
 */
export function createFullTodo(overrides?: Partial<TodoInput>): TodoInput {
  return createFakeTodo({
    title: generateTodoTitle(),
    description: faker.lorem.paragraph(),
    dueDate: faker.date.future(),
    completed: false,
    ...overrides,
  });
}
