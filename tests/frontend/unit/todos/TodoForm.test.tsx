import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TodoForm } from '../../../../src/frontend/components/todos/TodoForm';
import { createMockTodo, createMockCategory } from '../testUtils';

describe('TodoForm', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    categories: [],
    onSubmit: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render create form when no todo is provided', () => {
    render(<TodoForm {...defaultProps} />);

    expect(screen.getByText('Create Todo')).toBeInTheDocument();
    expect(screen.getByTestId('todo-title-input')).toHaveValue('');
  });

  it('should render edit form when todo is provided', () => {
    const todo = createMockTodo({ title: 'Existing Todo', description: 'Description' });
    render(<TodoForm {...defaultProps} todo={todo} />);

    expect(screen.getByText('Edit Todo')).toBeInTheDocument();
    expect(screen.getByTestId('todo-title-input')).toHaveValue('Existing Todo');
    expect(screen.getByTestId('todo-description-input')).toHaveValue('Description');
  });

  it('should show error when submitting empty title', async () => {
    render(<TodoForm {...defaultProps} />);

    fireEvent.click(screen.getByTestId('todo-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('todo-title-error')).toHaveTextContent(
        'Title is required'
      );
    });
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('should show error when title is too long', async () => {
    render(<TodoForm {...defaultProps} />);

    const input = screen.getByTestId('todo-title-input');
    fireEvent.change(input, { target: { value: 'a'.repeat(201) } });
    fireEvent.click(screen.getByTestId('todo-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('todo-title-error')).toHaveTextContent(
        'Title must be 200 characters or less'
      );
    });
  });

  it('should call onSubmit with form data for create', async () => {
    const categories = [createMockCategory({ id: 1, name: 'Work' })];
    render(<TodoForm {...defaultProps} categories={categories} />);

    fireEvent.change(screen.getByTestId('todo-title-input'), {
      target: { value: 'New Todo' },
    });
    fireEvent.change(screen.getByTestId('todo-description-input'), {
      target: { value: 'Description' },
    });

    fireEvent.click(screen.getByTestId('todo-submit'));

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Todo',
          description: 'Description',
        })
      );
    });
  });

  it('should close dialog on successful submit', async () => {
    render(<TodoForm {...defaultProps} />);

    fireEvent.change(screen.getByTestId('todo-title-input'), {
      target: { value: 'New Todo' },
    });
    fireEvent.click(screen.getByTestId('todo-submit'));

    await waitFor(() => {
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('should render category select with options', () => {
    const categories = [
      createMockCategory({ id: 1, name: 'Work' }),
      createMockCategory({ id: 2, name: 'Personal' }),
    ];
    render(<TodoForm {...defaultProps} categories={categories} />);

    expect(screen.getByTestId('todo-category-select')).toBeInTheDocument();
  });

  it('should render date picker trigger', () => {
    render(<TodoForm {...defaultProps} />);
    expect(screen.getByTestId('todo-duedate-trigger')).toBeInTheDocument();
  });

  it('should call onOpenChange when cancel is clicked', () => {
    render(<TodoForm {...defaultProps} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should pre-populate form when editing', () => {
    const todo = createMockTodo({
      title: 'Edit Me',
      description: 'My description',
      categoryId: 1,
      category: { id: 1, name: 'Work' },
    });
    const categories = [createMockCategory({ id: 1, name: 'Work' })];

    render(<TodoForm {...defaultProps} todo={todo} categories={categories} />);

    expect(screen.getByTestId('todo-title-input')).toHaveValue('Edit Me');
    expect(screen.getByTestId('todo-description-input')).toHaveValue('My description');
  });

  it('should not render dialog content when open is false', () => {
    render(<TodoForm {...defaultProps} open={false} />);
    expect(screen.queryByText('Create Todo')).not.toBeInTheDocument();
  });
});
