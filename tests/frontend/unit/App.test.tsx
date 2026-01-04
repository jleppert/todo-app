import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import '@testing-library/jest-dom';
import App from '../../../src/frontend/App';
import { createMockStore, mockFetch } from './testUtils';

describe('App Router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
  });

  const renderApp = (initialRoute: string) => {
    const store = createMockStore();
    return render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <App />
        </MemoryRouter>
      </Provider>
    );
  };

  describe('Route rendering', () => {
    it('should render TodoApp at /todos', async () => {
      renderApp('/todos');
      await waitFor(() => {
        expect(screen.getByTestId('todo-app')).toBeInTheDocument();
      });
    });

    it('should render TodoApp at /todos/active', async () => {
      renderApp('/todos/active');
      await waitFor(() => {
        expect(screen.getByTestId('todo-app')).toBeInTheDocument();
      });
    });

    it('should render TodoApp at /todos/completed', async () => {
      renderApp('/todos/completed');
      await waitFor(() => {
        expect(screen.getByTestId('todo-app')).toBeInTheDocument();
      });
    });

    it('should render TodoApp at /categories', async () => {
      renderApp('/categories');
      await waitFor(() => {
        expect(screen.getByTestId('todo-app')).toBeInTheDocument();
      });
    });

    it('should render TodoApp at /todos/new', async () => {
      renderApp('/todos/new');
      await waitFor(() => {
        expect(screen.getByTestId('todo-app')).toBeInTheDocument();
      });
    });

    it('should render TodoApp at /todos/1/edit', async () => {
      renderApp('/todos/1/edit');
      await waitFor(() => {
        expect(screen.getByTestId('todo-app')).toBeInTheDocument();
      });
    });
  });

  describe('Redirects', () => {
    it('should redirect from / to /todos', async () => {
      renderApp('/');
      await waitFor(() => {
        expect(screen.getByTestId('todo-app')).toBeInTheDocument();
      });
    });

    it('should redirect unknown routes to /todos', async () => {
      renderApp('/unknown-route');
      await waitFor(() => {
        expect(screen.getByTestId('todo-app')).toBeInTheDocument();
      });
    });
  });
});
