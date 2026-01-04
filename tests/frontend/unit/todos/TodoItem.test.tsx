import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TodoItem } from '../../../../src/frontend/components/todos/TodoItem';
import { createMockTodo, createMockCategory } from '../testUtils';

describe('TodoItem', () => {
  const defaultProps = {
    todo: createMockTodo({ id: 1, title: 'Test Todo' }),
    onToggle: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render todo title', () => {
    render(<TodoItem {...defaultProps} />);
    expect(screen.getByText('Test Todo')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    const todo = createMockTodo({ description: 'This is a description' });
    render(<TodoItem {...defaultProps} todo={todo} />);
    expect(screen.getByText('This is a description')).toBeInTheDocument();
  });

  it('should not render description when null', () => {
    const todo = createMockTodo({ description: null });
    render(<TodoItem {...defaultProps} todo={todo} />);
    expect(screen.queryByText('This is a description')).not.toBeInTheDocument();
  });

  it('should render category badge when category exists', () => {
    const todo = createMockTodo({
      categoryId: 1,
      category: { id: 1, name: 'Work' },
    });
    render(<TodoItem {...defaultProps} todo={todo} />);
    expect(screen.getByText('Work')).toBeInTheDocument();
  });

  it('should render due date when provided', () => {
    const todo = createMockTodo({ dueDate: '2024-12-25T00:00:00.000Z' });
    render(<TodoItem {...defaultProps} todo={todo} />);
    expect(screen.getByText(/Due:/)).toBeInTheDocument();
  });

  it('should show overdue styling for past due dates', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const todo = createMockTodo({
      dueDate: pastDate.toISOString(),
      completed: false,
    });
    render(<TodoItem {...defaultProps} todo={todo} />);

    const dueText = screen.getByText(/Due:/);
    expect(dueText).toHaveClass('text-destructive');
  });

  it('should not show overdue styling for completed todos', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const todo = createMockTodo({
      dueDate: pastDate.toISOString(),
      completed: true,
    });
    render(<TodoItem {...defaultProps} todo={todo} />);

    const dueText = screen.getByText(/Due:/);
    expect(dueText).not.toHaveClass('text-destructive');
  });

  it('should call onToggle when checkbox is clicked', () => {
    render(<TodoItem {...defaultProps} />);

    const checkbox = screen.getByTestId('todo-checkbox-1');
    fireEvent.click(checkbox);
    expect(defaultProps.onToggle).toHaveBeenCalledWith(1);
  });

  it('should show completed styling when todo is completed', () => {
    const todo = createMockTodo({ completed: true });
    render(<TodoItem {...defaultProps} todo={todo} />);

    expect(screen.getByText('Test Todo')).toHaveClass('line-through');
  });

  it('should render menu trigger button', () => {
    render(<TodoItem {...defaultProps} />);

    const menuTrigger = screen.getByTestId('todo-menu-1');
    expect(menuTrigger).toBeInTheDocument();
    expect(menuTrigger).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('should have correct testid', () => {
    render(<TodoItem {...defaultProps} />);
    expect(screen.getByTestId('todo-item-1')).toBeInTheDocument();
  });
});
