import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Header } from '../../../../src/frontend/components/shared/Header';

const renderHeader = (props: { onManageCategories?: () => void } = {}) => {
  return render(
    <Header onManageCategories={props.onManageCategories ?? (() => {})} />
  );
};

describe('Header', () => {
  it('should render the app title', () => {
    renderHeader();
    expect(screen.getByText('Todo App')).toBeInTheDocument();
  });

  it('should render manage categories button', () => {
    renderHeader();
    expect(screen.getByText('Manage Categories')).toBeInTheDocument();
  });

  it('should call onManageCategories when button is clicked', () => {
    const onManageCategories = jest.fn();
    renderHeader({ onManageCategories });

    fireEvent.click(screen.getByText('Manage Categories'));
    expect(onManageCategories).toHaveBeenCalledTimes(1);
  });

  it('should have testid for header', () => {
    renderHeader();
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
  });

});
