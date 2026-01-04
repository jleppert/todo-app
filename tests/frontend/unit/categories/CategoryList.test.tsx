import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CategoryList } from '../../../../src/frontend/components/categories/CategoryList';
import { createMockCategory } from '../testUtils';

describe('CategoryList', () => {
  const defaultProps = {
    categories: [],
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render empty state when no categories', () => {
    render(<CategoryList {...defaultProps} />);
    expect(screen.getByTestId('no-categories')).toBeInTheDocument();
    expect(
      screen.getByText('No categories yet. Create one to organize your todos.')
    ).toBeInTheDocument();
  });

  it('should render list of categories', () => {
    const categories = [
      createMockCategory({ id: 1, name: 'Work' }),
      createMockCategory({ id: 2, name: 'Personal' }),
      createMockCategory({ id: 3, name: 'Shopping' }),
    ];

    render(<CategoryList {...defaultProps} categories={categories} />);

    expect(screen.getByTestId('category-list')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('Shopping')).toBeInTheDocument();
  });

  it('should call onEdit when edit is clicked on a category', () => {
    const categories = [createMockCategory({ id: 1, name: 'Work' })];
    render(<CategoryList {...defaultProps} categories={categories} />);

    fireEvent.click(screen.getByTestId('edit-category-1'));
    expect(defaultProps.onEdit).toHaveBeenCalledWith(categories[0]);
  });

  it('should call onDelete when delete is clicked on a category', () => {
    const categories = [createMockCategory({ id: 1, name: 'Work' })];
    render(<CategoryList {...defaultProps} categories={categories} />);

    fireEvent.click(screen.getByTestId('delete-category-1'));
    expect(defaultProps.onDelete).toHaveBeenCalledWith(categories[0]);
  });
});
