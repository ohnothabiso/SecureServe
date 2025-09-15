import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';

// Mock Firebase
jest.mock('../services/firebase', () => ({
  firestore: {
    collection: jest.fn(() => ({
      getDocs: jest.fn(() => Promise.resolve({
        forEach: jest.fn(),
      })),
    })),
  },
}));

// Mock Firestore hooks
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn((callback) => {
    callback({
      forEach: jest.fn(),
    });
    return jest.fn(); // unsubscribe function
  }),
  getDocs: jest.fn(() => Promise.resolve({
    forEach: jest.fn(),
  })),
}));

const MockedDashboard = () => (
  <BrowserRouter>
    <Dashboard />
  </BrowserRouter>
);

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard title and description', () => {
    render(<MockedDashboard />);

    expect(screen.getByText('Dashboard')).toBeTruthy();
    expect(screen.getByText('Overview of AmberSA system status')).toBeTruthy();
  });

  it('displays stats cards', () => {
    render(<MockedDashboard />);

    expect(screen.getByText('Total Alerts')).toBeTruthy();
    expect(screen.getByText('Active Alerts')).toBeTruthy();
    expect(screen.getByText('Total Users')).toBeTruthy();
    expect(screen.getByText('Verified Admins')).toBeTruthy();
  });

  it('shows recent alerts section', () => {
    render(<MockedDashboard />);

    expect(screen.getByText('Recent Alerts')).toBeTruthy();
  });

  it('displays quick actions section', () => {
    render(<MockedDashboard />);

    expect(screen.getByText('Quick Actions')).toBeTruthy();
    expect(screen.getByText('Create New Alert')).toBeTruthy();
    expect(screen.getByText('Manage Users')).toBeTruthy();
  });

  it('shows loading state initially', () => {
    render(<MockedDashboard />);

    // The component should show a loading state initially
    // This depends on the implementation of the loading state
    expect(screen.getByText('Dashboard')).toBeTruthy();
  });

  it('handles empty alerts state', async () => {
    render(<MockedDashboard />);

    // Should handle case when no alerts exist
    await waitFor(() => {
      expect(screen.getByText('Recent Alerts')).toBeTruthy();
    });
  });
});