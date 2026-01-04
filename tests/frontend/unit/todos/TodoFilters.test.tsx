import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TodoFilters } from '../../../../src/frontend/components/todos/TodoFilters';
import { createMockCategory } from '../testUtils';
import type { TodoFilters as TodoFiltersType } from '../../../../src/frontend/types';

describe('TodoFilters', () => {
  const defaultFilters: TodoFiltersType = {
    status: 'all',
    categoryId: null,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    groupByCategory: false,
  };

  const defaultProps = {
    filters: defaultFilters,
    categories: [],
    onStatusChange: jest.fn(),
    onCategoryChange: jest.fn(),
    onSortByChange: jest.fn(),
    onSortOrderChange: jest.fn(),
    onGroupByCategoryChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render filter container', () => {
    render(<TodoFilters {...defaultProps} />);
    expect(screen.getByTestId('todo-filters')).toBeInTheDocument();
  });

  it('should render status filter tabs', () => {
    render(<TodoFilters {...defaultProps} />);
    expect(screen.getByTestId('filter-all')).toBeInTheDocument();
    expect(screen.getByTestId('filter-active')).toBeInTheDocument();
    expect(screen.getByTestId('filter-completed')).toBeInTheDocument();
  });

  it('should highlight the active status tab', () => {
    const filters = { ...defaultFilters, status: 'active' as const };
    render(<TodoFilters {...defaultProps} filters={filters} />);

    const activeTab = screen.getByTestId('filter-active');
    expect(activeTab).toHaveAttribute('data-state', 'active');
  });

  it('should render category filter select', () => {
    const categories = [
      createMockCategory({ id: 1, name: 'Work' }),
      createMockCategory({ id: 2, name: 'Personal' }),
    ];
    render(<TodoFilters {...defaultProps} categories={categories} />);

    expect(screen.getByTestId('category-filter')).toBeInTheDocument();
  });

  it('should render sort by select', () => {
    render(<TodoFilters {...defaultProps} />);
    expect(screen.getByTestId('sort-by')).toBeInTheDocument();
  });

  it('should render sort order toggle button', () => {
    render(<TodoFilters {...defaultProps} />);
    expect(screen.getByTestId('sort-order')).toBeInTheDocument();
  });

  it('should call onSortOrderChange when sort order button is clicked', () => {
    render(<TodoFilters {...defaultProps} />);

    fireEvent.click(screen.getByTestId('sort-order'));
    expect(defaultProps.onSortOrderChange).toHaveBeenCalledWith('asc');
  });

  it('should toggle sort order from asc to desc', () => {
    const filters = { ...defaultFilters, sortOrder: 'asc' as const };
    render(<TodoFilters {...defaultProps} filters={filters} />);

    fireEvent.click(screen.getByTestId('sort-order'));
    expect(defaultProps.onSortOrderChange).toHaveBeenCalledWith('desc');
  });

  it('should render group by category checkbox', () => {
    render(<TodoFilters {...defaultProps} />);
    expect(screen.getByTestId('group-by-category')).toBeInTheDocument();
  });

  it('should call onGroupByCategoryChange when checkbox is clicked', () => {
    render(<TodoFilters {...defaultProps} />);

    fireEvent.click(screen.getByTestId('group-by-category'));
    expect(defaultProps.onGroupByCategoryChange).toHaveBeenCalledWith(true);
  });
});
