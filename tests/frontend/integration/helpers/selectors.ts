/**
 * CSS selectors for integration tests
 * All selectors use data-testid attributes for reliability
 */
export const selectors = {
  // App structure
  app: '#root',
  todoApp: '[data-testid="todo-app"]',

  // Loading and error states
  loading: '[data-testid="todo-list-loading"]',
  errorMessage: '[data-testid="error-message"]',
  retryButton: '[data-testid="retry-button"]',
  emptyState: '[data-testid="empty-state"]',
  createFirstTodo: '[data-testid="create-first-todo"]',

  // Todo list
  todoList: '[data-testid="todo-list"]',
  todoListGrouped: '[data-testid="todo-list-grouped"]',
  todoItem: (id: number) => `[data-testid="todo-item-${id}"]`,
  todoCheckbox: (id: number) => `[data-testid="todo-checkbox-${id}"]`,
  todoMenu: (id: number) => `[data-testid="todo-menu-${id}"]`,
  todoTitle: '.todo-title',
  todoDescription: '.todo-description',
  todoDueDate: '.todo-due-date',
  todoCategoryBadge: '.todo-category-badge',

  // Todo form dialog
  addTodoButton: '[data-testid="add-todo-fab"]',
  todoDialog: '[role="dialog"]',
  todoForm: '[data-testid="todo-form"]',
  todoTitleInput: '[data-testid="todo-title-input"]',
  todoDescriptionInput: '[data-testid="todo-description-input"]',
  todoDueDateTrigger: '[data-testid="todo-duedate-trigger"]',
  todoCategorySelect: '[data-testid="todo-category-select"]',
  todoSubmit: '[data-testid="todo-submit"]',
  todoTitleError: '[data-testid="todo-title-error"]',
  todoCancel: 'button:has-text("Cancel")',

  // Dropdown menu items (dynamic based on todo id)
  menuEdit: (id: number) => `[data-testid="edit-todo-${id}"]`,
  menuDelete: (id: number) => `[data-testid="delete-todo-${id}"]`,

  // Filters
  todoFilters: '[data-testid="todo-filters"]',
  statusTabAll: '[data-testid="filter-all"]',
  statusTabActive: '[data-testid="filter-active"]',
  statusTabCompleted: '[data-testid="filter-completed"]',
  categoryFilter: '[data-testid="category-filter"]',
  sortBySelect: '[data-testid="sort-by"]',
  sortOrderButton: '[data-testid="sort-order"]',
  groupByCheckbox: '[data-testid="group-by-category"]',

  // Category groups
  todoGroup: (categoryId: number | null) =>
    `[data-testid="todo-group-${categoryId ?? 'uncategorized'}"]`,
  todoGroupHeader: '.todo-group-header',

  // Header
  header: '[data-testid="header"]',
  manageCategoriesButton: '[data-testid="manage-categories"]',

  // Category manager dialog
  categoryDialog: '[data-testid="category-manager"]',
  addCategoryButton: '[data-testid="add-category-button"]',
  categoryNameInput: '[data-testid="category-name-input"]',
  categorySubmit: '[data-testid="category-submit"]',
  categoryItem: (id: number) => `[data-testid="category-item-${id}"]`,
  categoryEditButton: (id: number) => `[data-testid="edit-category-${id}"]`,
  categoryDeleteButton: (id: number) => `[data-testid="delete-category-${id}"]`,

  // Toast notifications
  toast: '[data-sonner-toast]',
  toastUndo: '[data-testid="toast-undo"]',

  // Calendar
  calendar: '[data-testid="calendar"]',
  calendarDay: (day: number) => `[data-testid="calendar-day-${day}"]`,
};

/**
 * Helper to build a selector with a dynamic value
 */
export function buildSelector(
  template: string,
  value: string | number
): string {
  return template.replace('$value', String(value));
}
