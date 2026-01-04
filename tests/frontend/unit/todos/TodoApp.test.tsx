import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import '@testing-library/jest-dom';
import { TodoApp } from '../../../../src/frontend/components/todos/TodoApp';
import { createMockStore, createMockTodo, mockFetch } from '../testUtils';

describe('TodoApp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
    document.title = 'Test';
  });

  const renderTodoApp = (initialRoute: string, preloadedState = {}) => {
    const store = createMockStore(preloadedState);
    return render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/todos" element={<TodoApp />}>
              <Route path="new" element={null} />
              <Route path=":id/edit" element={null} />
            </Route>
            <Route path="/todos/active" element={<TodoApp />}>
              <Route path="new" element={null} />
              <Route path=":id/edit" element={null} />
            </Route>
            <Route path="/todos/completed" element={<TodoApp />}>
              <Route path="new" element={null} />
              <Route path=":id/edit" element={null} />
            </Route>
            <Route path="/categories" element={<TodoApp />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
  };

  describe('Page Title', () => {
    it('should set title to "All Todos - Todo App" at /todos', async () => {
      renderTodoApp('/todos');
      await waitFor(() => {
        expect(document.title).toBe('All Todos - Todo App');
      });
    });

    it('should set title to "Active Todos - Todo App" at /todos/active', async () => {
      renderTodoApp('/todos/active');
      await waitFor(() => {
        expect(document.title).toBe('Active Todos - Todo App');
      });
    });

    it('should set title to "Completed Todos - Todo App" at /todos/completed', async () => {
      renderTodoApp('/todos/completed');
      await waitFor(() => {
        expect(document.title).toBe('Completed Todos - Todo App');
      });
    });

    it('should set title to "New Todo - Todo App" at /todos/new', async () => {
      renderTodoApp('/todos/new');
      await waitFor(() => {
        expect(document.title).toBe('New Todo - Todo App');
      });
    });

    it('should set title to "New Todo - Todo App" at /todos/active/new', async () => {
      renderTodoApp('/todos/active/new');
      await waitFor(() => {
        expect(document.title).toBe('New Todo - Todo App');
      });
    });

    it('should set title to "Manage Categories - Todo App" at /categories', async () => {
      renderTodoApp('/categories');
      await waitFor(() => {
        expect(document.title).toBe('Manage Categories - Todo App');
      });
    });

    it('should set title to "Edit Todo - Todo App" at /todos/:id/edit when todo not loaded', async () => {
      renderTodoApp('/todos/999/edit');
      await waitFor(() => {
        expect(document.title).toBe('Edit Todo - Todo App');
      });
    });

    it('should set title with todo name at /todos/:id/edit when todo is loaded', async () => {
      const todos = [createMockTodo({ id: 1, title: 'Buy groceries' })];
      renderTodoApp('/todos/1/edit', {
        todos: {
          items: todos,
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
        },
      });
      await waitFor(() => {
        expect(document.title).toBe('Edit: Buy groceries - Todo App');
      });
    });
  });

  describe('Rendering', () => {
    it('should render the todo app container', async () => {
      renderTodoApp('/todos');
      await waitFor(() => {
        expect(screen.getByTestId('todo-app')).toBeInTheDocument();
      });
    });

    it('should render the header', async () => {
      renderTodoApp('/todos');
      await waitFor(() => {
        expect(screen.getByTestId('app-header')).toBeInTheDocument();
      });
    });

    it('should render the add todo FAB button', async () => {
      renderTodoApp('/todos');
      await waitFor(() => {
        expect(screen.getByTestId('add-todo-fab')).toBeInTheDocument();
      });
    });
  });
});
