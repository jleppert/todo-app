import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import '@testing-library/jest-dom';
import { MapPage } from '../../../../src/frontend/components/map/MapPage';
import { createMockStore, mockFetch } from '../testUtils';

const renderMapPage = () => {
  const store = createMockStore();
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/map']}>
        <MapPage />
      </MemoryRouter>
    </Provider>
  );
};

describe('MapPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
  });

  it('should render the map page container', () => {
    renderMapPage();
    expect(screen.getByTestId('map-page')).toBeInTheDocument();
  });

  it('should render the map container', () => {
    renderMapPage();
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('should have full-height layout classes', () => {
    renderMapPage();
    const container = screen.getByTestId('map-page');
    expect(container).toHaveClass('h-screen', 'flex');
  });

  it('should render the upload panel', () => {
    renderMapPage();
    expect(screen.getByTestId('upload-panel')).toBeInTheDocument();
  });

  it('should render the drop zone', () => {
    renderMapPage();
    expect(screen.getByTestId('drop-zone')).toBeInTheDocument();
  });
});
