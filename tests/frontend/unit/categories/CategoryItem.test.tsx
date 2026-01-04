import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CategoryItem } from '../../../../src/frontend/components/categories/CategoryItem';
import { createMockCategory } from '../testUtils';

describe('CategoryItem', () => {
  const defaultProps = {
    category: createMockCategory({ id: 1, name: 'Work', todoCount: 5 }),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render category name', () => {
    render(<CategoryItem {...defaultProps} />);
    expect(screen.getByText('Work')).toBeInTheDocument();
  });

  it('should render todo count badge', () => {
    render(<CategoryItem {...defaultProps} />);
    expect(screen.getByText('5 todos')).toBeInTheDocument();
  });

  it('should render edit and delete buttons', () => {
    render(<CategoryItem {...defaultProps} />);
    expect(screen.getByTestId('edit-category-1')).toBeInTheDocument();
    expect(screen.getByTestId('delete-category-1')).toBeInTheDocument();
  });

  it('should call onEdit with category when edit button is clicked', () => {
    render(<CategoryItem {...defaultProps} />);

    fireEvent.click(screen.getByTestId('edit-category-1'));
    expect(defaultProps.onEdit).toHaveBeenCalledWith(defaultProps.category);
  });

  it('should call onDelete with category when delete button is clicked', () => {
    render(<CategoryItem {...defaultProps} />);

    fireEvent.click(screen.getByTestId('delete-category-1'));
    expect(defaultProps.onDelete).toHaveBeenCalledWith(defaultProps.category);
  });

  it('should have correct testid', () => {
    render(<CategoryItem {...defaultProps} />);
    expect(screen.getByTestId('category-item-1')).toBeInTheDocument();
  });

  it('should display zero todos correctly', () => {
    const category = createMockCategory({ todoCount: 0 });
    render(<CategoryItem {...defaultProps} category={category} />);
    expect(screen.getByText('0 todos')).toBeInTheDocument();
  });
});
