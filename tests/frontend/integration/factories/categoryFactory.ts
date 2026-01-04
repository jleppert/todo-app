import { faker } from '@faker-js/faker';

export interface CategoryInput {
  name: string;
}

/**
 * Create a single fake category with realistic data
 */
export function createFakeCategory(
  overrides?: Partial<CategoryInput>
): CategoryInput {
  return {
    name: faker.commerce.department(),
    ...overrides,
  };
}

/**
 * Create multiple categories with guaranteed unique names
 */
export function createFakeCategories(count: number): CategoryInput[] {
  const names = new Set<string>();
  const categories: CategoryInput[] = [];

  // Pre-defined category names for variety
  const categoryNames = [
    'Work',
    'Personal',
    'Shopping',
    'Health',
    'Finance',
    'Education',
    'Home',
    'Travel',
    'Social',
    'Projects',
    'Hobbies',
    'Family',
    'Urgent',
    'Ideas',
    'Goals',
  ];

  // Use predefined names first, then generate
  let index = 0;
  while (categories.length < count) {
    let name: string;

    if (index < categoryNames.length) {
      name = categoryNames[index];
    } else {
      // Generate unique names using faker
      name = faker.commerce.department();
      let attempts = 0;
      while (names.has(name) && attempts < 100) {
        name = `${faker.commerce.department()} ${faker.number.int({ min: 1, max: 999 })}`;
        attempts++;
      }
    }

    if (!names.has(name)) {
      names.add(name);
      categories.push({ name });
    }
    index++;
  }

  return categories;
}

/**
 * Create a work-related category
 */
export function createWorkCategory(): CategoryInput {
  return createFakeCategory({ name: 'Work' });
}

/**
 * Create a personal category
 */
export function createPersonalCategory(): CategoryInput {
  return createFakeCategory({ name: 'Personal' });
}
