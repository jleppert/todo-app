import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Header } from '../../../../src/frontend/components/shared/Header';

describe('Header', () => {
  it('should render the app title', () => {
    render(<Header onManageCategories={() => {}} />);
    expect(screen.getByText('Todo App')).toBeInTheDocument();
  });

  it('should render manage categories button', () => {
    render(<Header onManageCategories={() => {}} />);
    expect(screen.getByText('Manage Categories')).toBeInTheDocument();
  });

  it('should call onManageCategories when button is clicked', () => {
    const onManageCategories = jest.fn();
    render(<Header onManageCategories={onManageCategories} />);

    fireEvent.click(screen.getByText('Manage Categories'));
    expect(onManageCategories).toHaveBeenCalledTimes(1);
  });

  it('should have testid for header', () => {
    render(<Header onManageCategories={() => {}} />);
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
  });
});
