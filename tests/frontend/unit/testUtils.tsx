import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import todosReducer, { TodosState } from '../../../src/frontend/store/todosSlice';
import categoriesReducer, { CategoriesState } from '../../../src/frontend/store/categoriesSlice';
import type { Todo, Category } from '../../../src/frontend/types';

// Mock data factories
export const createMockCategory = (overrides: Partial<Category> = {}): Category => ({
  id: 1,
  name: 'Test Category',
  todoCount: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 1,
  title: 'Test Todo',
  description: null,
  dueDate: null,
  completed: false,
  categoryId: null,
  category: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

// Default states
export const defaultTodosState: TodosState = {
  items: [],
  grouped: null,
  selectedTodo: null,
  loading: false,
  error: null,
  filters: {
    status: 'all',
    categoryId: null,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    groupByCategory: false,
  },
};

export const defaultCategoriesState: CategoriesState = {
  items: [],
  loading: false,
  error: null,
};

// Create mock store
export const createMockStore = (preloadedState: {
  todos?: TodosState;
  categories?: CategoriesState;
} = {}) => {
  return configureStore({
    reducer: {
      todos: todosReducer,
      categories: categoriesReducer,
    },
    preloadedState: {
      todos: defaultTodosState,
      categories: defaultCategoriesState,
      ...preloadedState,
    },
  });
};

// Custom render with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Parameters<typeof createMockStore>[0];
  store?: ReturnType<typeof createMockStore>;
  initialEntries?: string[];
}

export const renderWithProviders = (
  ui: ReactElement,
  {
    preloadedState = {},
    store = createMockStore(preloadedState),
    initialEntries = ['/'],
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    </Provider>
  );

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

// Mock fetch helper
export const mockFetch = jest.fn();
global.fetch = mockFetch;

export const mockFetchSuccess = (data: unknown) => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data }),
  });
};

export const mockFetchError = (message: string, status = 400) => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ error: { message } }),
  });
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
