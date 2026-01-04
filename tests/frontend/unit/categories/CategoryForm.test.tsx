import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CategoryForm } from '../../../../src/frontend/components/categories/CategoryForm';
import { createMockCategory } from '../testUtils';

describe('CategoryForm', () => {
  const defaultProps = {
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render create form when no category is provided', () => {
    render(<CategoryForm {...defaultProps} />);

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should render edit form when category is provided', () => {
    const category = createMockCategory({ name: 'Work' });
    render(<CategoryForm {...defaultProps} category={category} />);

    expect(screen.getByDisplayValue('Work')).toBeInTheDocument();
    expect(screen.getByText('Update')).toBeInTheDocument();
  });

  it('should show error when submitting empty name', async () => {
    render(<CategoryForm {...defaultProps} />);

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByTestId('category-form-error')).toHaveTextContent(
        'Category name is required'
      );
    });
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('should show error when name is too long', async () => {
    render(<CategoryForm {...defaultProps} />);

    const input = screen.getByTestId('category-name-input');
    fireEvent.change(input, { target: { value: 'a'.repeat(51) } });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByTestId('category-form-error')).toHaveTextContent(
        'Category name must be 50 characters or less'
      );
    });
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('should call onSubmit with trimmed name', async () => {
    render(<CategoryForm {...defaultProps} />);

    const input = screen.getByTestId('category-name-input');
    fireEvent.change(input, { target: { value: '  Work  ' } });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith('Work');
    });
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(<CategoryForm {...defaultProps} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('should disable inputs when isSubmitting is true', () => {
    render(<CategoryForm {...defaultProps} isSubmitting />);

    expect(screen.getByTestId('category-name-input')).toBeDisabled();
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('should clear error when input changes', async () => {
    render(<CategoryForm {...defaultProps} />);

    // Submit empty to trigger error
    fireEvent.click(screen.getByText('Create'));
    await waitFor(() => {
      expect(screen.getByTestId('category-form-error')).toBeInTheDocument();
    });

    // Type to clear error
    const input = screen.getByTestId('category-name-input');
    fireEvent.change(input, { target: { value: 'Work' } });

    expect(screen.queryByTestId('category-form-error')).not.toBeInTheDocument();
  });
});
