import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TodoList } from '../../../../src/frontend/components/todos/TodoList';
import { createMockTodo } from '../testUtils';

describe('TodoList', () => {
  const defaultProps = {
    todos: [],
    grouped: null,
    isGrouped: false,
    loading: false,
    error: null,
    statusFilter: 'all' as const,
    hasCategory: false,
    onToggle: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onRetry: jest.fn(),
    onCreateTodo: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading spinner when loading', () => {
    render(<TodoList {...defaultProps} loading />);
    expect(screen.getByTestId('todo-list-loading')).toBeInTheDocument();
  });

  it('should show error message when error exists', () => {
    render(<TodoList {...defaultProps} error="Failed to load todos" />);
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByText('Failed to load todos')).toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked on error', () => {
    render(<TodoList {...defaultProps} error="Failed to load todos" />);

    fireEvent.click(screen.getByTestId('retry-button'));
    expect(defaultProps.onRetry).toHaveBeenCalledTimes(1);
  });

  it('should show empty state when no todos', () => {
    render(<TodoList {...defaultProps} />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('should render list of todos', () => {
    const todos = [
      createMockTodo({ id: 1, title: 'Todo 1' }),
      createMockTodo({ id: 2, title: 'Todo 2' }),
      createMockTodo({ id: 3, title: 'Todo 3' }),
    ];

    render(<TodoList {...defaultProps} todos={todos} />);

    expect(screen.getByTestId('todo-list')).toBeInTheDocument();
    expect(screen.getByText('Todo 1')).toBeInTheDocument();
    expect(screen.getByText('Todo 2')).toBeInTheDocument();
    expect(screen.getByText('Todo 3')).toBeInTheDocument();
  });

  it('should render grouped todos when isGrouped is true', () => {
    const grouped = [
      {
        category: { id: 1, name: 'Work' },
        todos: [createMockTodo({ id: 1, title: 'Work Todo' })],
      },
      {
        category: null,
        todos: [createMockTodo({ id: 2, title: 'Uncategorized Todo' })],
      },
    ];

    render(<TodoList {...defaultProps} grouped={grouped} isGrouped />);

    expect(screen.getByTestId('todo-list-grouped')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Uncategorized')).toBeInTheDocument();
  });

  it('should show empty state for grouped when no groups', () => {
    render(<TodoList {...defaultProps} grouped={[]} isGrouped />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('should call onToggle when todo is toggled', () => {
    const todos = [createMockTodo({ id: 1, title: 'Todo 1' })];
    render(<TodoList {...defaultProps} todos={todos} />);

    fireEvent.click(screen.getByTestId('todo-checkbox-1'));
    expect(defaultProps.onToggle).toHaveBeenCalledWith(1);
  });

  it('should render todo menu trigger for each item', () => {
    const todos = [
      createMockTodo({ id: 1, title: 'Todo 1' }),
      createMockTodo({ id: 2, title: 'Todo 2' }),
    ];
    render(<TodoList {...defaultProps} todos={todos} />);

    expect(screen.getByTestId('todo-menu-1')).toBeInTheDocument();
    expect(screen.getByTestId('todo-menu-2')).toBeInTheDocument();
  });

  it('should call onCreateTodo from empty state', () => {
    render(<TodoList {...defaultProps} />);

    fireEvent.click(screen.getByTestId('create-first-todo'));
    expect(defaultProps.onCreateTodo).toHaveBeenCalledTimes(1);
  });
});
