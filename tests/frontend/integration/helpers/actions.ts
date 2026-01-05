import type { WebDriver } from 'selenium-webdriver';
import {
  waitForElement,
  clickElement,
  typeIntoElement,
  waitForPageLoad,
  elementExists,
} from '../setup/testDriver.ts';
import { getServerUrl } from '../setup/testServer.ts';
import { selectors } from './selectors.ts';

// Navigation
export async function navigateToApp(driver: WebDriver): Promise<void> {
  await driver.get(getServerUrl());
  await waitForPageLoad(driver);
}

export async function waitForAppLoad(driver: WebDriver): Promise<void> {
  // Wait for either the todo list or empty state to appear
  await driver.wait(async () => {
    const hasList = await elementExists(driver, selectors.todoList);
    const hasGroupedList = await elementExists(driver, selectors.todoListGrouped);
    const hasEmpty = await elementExists(driver, selectors.emptyState);
    return hasList || hasGroupedList || hasEmpty;
  }, 10000);
}

export async function refreshPage(driver: WebDriver): Promise<void> {
  await driver.navigate().refresh();
  await waitForAppLoad(driver);
}

// Todo CRUD
export async function openCreateTodoDialog(driver: WebDriver): Promise<void> {
  await clickElement(driver, selectors.addTodoButton);
  await waitForElement(driver, selectors.todoDialog);
}

export async function fillTodoForm(
  driver: WebDriver,
  data: {
    title: string;
    description?: string;
  }
): Promise<void> {
  await typeIntoElement(driver, selectors.todoTitleInput, data.title);

  if (data.description) {
    await typeIntoElement(
      driver,
      selectors.todoDescriptionInput,
      data.description
    );
  }
}

export async function submitTodoForm(driver: WebDriver): Promise<void> {
  await clickElement(driver, selectors.todoSubmit);

  // Wait for dialog to close (indicating success)
  await driver.wait(async () => {
    const dialogExists = await elementExists(driver, selectors.todoDialog);
    return !dialogExists;
  }, 5000);
}

export async function createTodo(
  driver: WebDriver,
  data: { title: string; description?: string }
): Promise<void> {
  await openCreateTodoDialog(driver);
  await fillTodoForm(driver, data);
  await submitTodoForm(driver);
}

export async function toggleTodoCompletion(
  driver: WebDriver,
  todoId: number
): Promise<void> {
  await clickElement(driver, selectors.todoCheckbox(todoId));
  // Small wait for the toggle to process
  await driver.sleep(500);
}

export async function openTodoMenu(
  driver: WebDriver,
  todoId: number
): Promise<void> {
  const menuButton = await waitForElement(driver, selectors.todoMenu(todoId));

  // Scroll into view first
  await driver.executeScript('arguments[0].scrollIntoView({block: "center"});', menuButton);
  await driver.sleep(200);

  // Click the menu button
  await menuButton.click();

  // Wait for dropdown animation
  await driver.sleep(500);
}

export async function deleteTodo(
  driver: WebDriver,
  todoId: number
): Promise<void> {
  await openTodoMenu(driver, todoId);

  // The delete button should now be visible in the DOM
  const deleteSelector = selectors.menuDelete(todoId);
  const deleteButton = await waitForElement(driver, deleteSelector);

  // Click the delete button
  await deleteButton.click();

  // Wait for toast to appear
  await driver.sleep(500);

  // The app uses "undo" pattern - actual delete happens after toast closes (5s)
  // Wait for toast to auto-close and API call to complete
  await driver.sleep(6000);
}

export async function editTodo(
  driver: WebDriver,
  todoId: number
): Promise<void> {
  await openTodoMenu(driver, todoId);
  await clickElement(driver, selectors.menuEdit(todoId));
  await waitForElement(driver, selectors.todoDialog);
}

// Filtering
export async function filterByStatus(
  driver: WebDriver,
  status: 'all' | 'active' | 'completed'
): Promise<void> {
  const selectorMap = {
    all: selectors.statusTabAll,
    active: selectors.statusTabActive,
    completed: selectors.statusTabCompleted,
  };
  await clickElement(driver, selectorMap[status]);
  // Wait for filter to apply
  await driver.sleep(500);
}

export async function filterByCategory(
  driver: WebDriver,
  category: { id: number; name: string } | null
): Promise<void> {
  await clickElement(driver, selectors.categoryFilter);
  // Wait for dropdown to open
  await driver.sleep(300);

  const optionText = category === null ? 'All categories' : category.name;

  // Radix Select options are div[role="option"] with text in a nested span
  const option = await driver.findElement({
    xpath: `//div[@role="option"][.//span[text()="${optionText}"]]`,
  });
  await option.click();
  await driver.sleep(500);
}

export async function toggleSortOrder(driver: WebDriver): Promise<void> {
  await clickElement(driver, selectors.sortOrderButton);
  await driver.sleep(500);
}

export async function toggleGroupByCategory(driver: WebDriver): Promise<void> {
  await clickElement(driver, selectors.groupByCheckbox);
  await driver.sleep(500);
}

// Categories
export async function openCategoryManager(driver: WebDriver): Promise<void> {
  await clickElement(driver, selectors.manageCategoriesButton);
  await waitForElement(driver, selectors.categoryDialog);
}

export async function createCategory(
  driver: WebDriver,
  name: string
): Promise<void> {
  // Click "Add Category" button to show the form
  await clickElement(driver, selectors.addCategoryButton);
  await waitForElement(driver, selectors.categoryNameInput);

  await typeIntoElement(driver, selectors.categoryNameInput, name);
  await clickElement(driver, selectors.categorySubmit);
  // Wait for creation
  await driver.sleep(500);
}

export async function deleteCategory(
  driver: WebDriver,
  categoryId: number
): Promise<void> {
  await clickElement(driver, selectors.categoryDeleteButton(categoryId));
  // Wait for deletion
  await driver.sleep(500);
}

export async function editCategory(
  driver: WebDriver,
  categoryId: number
): Promise<void> {
  await clickElement(driver, selectors.categoryEditButton(categoryId));
}

export async function updateCategory(
  driver: WebDriver,
  categoryId: number,
  newName: string
): Promise<void> {
  await clickElement(driver, selectors.categoryEditButton(categoryId));
  await waitForElement(driver, selectors.categoryNameInput);

  // Clear existing text and type new name
  const input = await driver.findElement({ css: selectors.categoryNameInput });
  await input.clear();
  await input.sendKeys(newName);

  await clickElement(driver, selectors.categorySubmit);
  // Wait for update to complete
  await driver.sleep(500);
}

export async function closeCategoryManager(driver: WebDriver): Promise<void> {
  // Click the X button or outside the dialog
  const closeButton = await driver.findElement({
    css: '[data-testid="category-manager"] button[type="button"]:has(svg)',
  });
  await closeButton.click();
  await driver.sleep(300);
}

// Toast interactions
export async function waitForToast(driver: WebDriver): Promise<void> {
  await waitForElement(driver, selectors.toast);
}

export async function clickUndo(driver: WebDriver): Promise<void> {
  await clickElement(driver, selectors.toastUndo);
  await driver.sleep(500);
}

// Utility
export async function countTodoItems(driver: WebDriver): Promise<number> {
  const elements = await driver.findElements({
    css: '[data-testid^="todo-item-"]',
  });
  return elements.length;
}
