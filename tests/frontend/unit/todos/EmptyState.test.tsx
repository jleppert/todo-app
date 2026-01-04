import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EmptyState } from '../../../../src/frontend/components/todos/EmptyState';

describe('EmptyState', () => {
  const defaultProps = {
    statusFilter: 'all' as const,
    hasCategory: false,
    onCreateTodo: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render empty state container', () => {
    render(<EmptyState {...defaultProps} />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('should show default message for all filter', () => {
    render(<EmptyState {...defaultProps} statusFilter="all" />);
    expect(screen.getByText('No todos yet. Create your first one!')).toBeInTheDocument();
  });

  it('should show active message for active filter', () => {
    render(<EmptyState {...defaultProps} statusFilter="active" />);
    expect(screen.getByText('No active todos. Time to add something!')).toBeInTheDocument();
  });

  it('should show completed message for completed filter', () => {
    render(<EmptyState {...defaultProps} statusFilter="completed" />);
    expect(screen.getByText('No completed todos yet. Keep working!')).toBeInTheDocument();
  });

  it('should show category-specific message when hasCategory is true', () => {
    render(<EmptyState {...defaultProps} hasCategory statusFilter="all" />);
    expect(screen.getByText('No todos in this category yet.')).toBeInTheDocument();
  });

  it('should show create button only for all filter', () => {
    render(<EmptyState {...defaultProps} statusFilter="all" />);
    expect(screen.getByTestId('create-first-todo')).toBeInTheDocument();
  });

  it('should not show create button for active filter', () => {
    render(<EmptyState {...defaultProps} statusFilter="active" />);
    expect(screen.queryByTestId('create-first-todo')).not.toBeInTheDocument();
  });

  it('should not show create button for completed filter', () => {
    render(<EmptyState {...defaultProps} statusFilter="completed" />);
    expect(screen.queryByTestId('create-first-todo')).not.toBeInTheDocument();
  });

  it('should call onCreateTodo when create button is clicked', () => {
    render(<EmptyState {...defaultProps} />);

    fireEvent.click(screen.getByTestId('create-first-todo'));
    expect(defaultProps.onCreateTodo).toHaveBeenCalledTimes(1);
  });
});
