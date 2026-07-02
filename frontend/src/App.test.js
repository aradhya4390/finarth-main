import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthContext } from './contexts/AuthContext';

test('renders a compact sidebar brand section for the mobile drawer layout', () => {
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AuthContext.Provider
        value={{
          user: { name: 'Test User', email: 'test@example.com' },
          token: 'demo-token',
          isAuthenticated: true,
          signup: jest.fn(),
          login: jest.fn(),
          logout: jest.fn(),
          updateProfile: jest.fn(),
        }}
      >
        <App />
      </AuthContext.Provider>
    </MemoryRouter>
  );

  expect(screen.getByText('Dashboard')).toBeInTheDocument();
  expect(document.querySelector('.sidebar-profile')).toBeTruthy();
  expect(document.querySelector('.sidebar-nav')).toBeTruthy();
});
