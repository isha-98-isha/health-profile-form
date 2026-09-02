import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DashboardNavbar from './components/Dashboard/DashboardNavbar';
import { PublicRoute, ProtectedRoute } from './App';

beforeEach(() => {
  document.documentElement.removeAttribute('data-theme');
  window.localStorage.clear();
  window.sessionStorage.clear();
});

test('light toggle updates the theme state and persists it', async () => {
  render(
    <MemoryRouter>
      <DashboardNavbar />
    </MemoryRouter>
  );

  await userEvent.click(screen.getByRole('button', { name: /light/i }));

  expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  expect(window.localStorage.getItem('vyonic-theme')).toBe('light');
});

test('public route redirects to dashboard when a valid session already exists', () => {
  window.localStorage.setItem('vyonic-auth-token', 'stored-token');
  window.localStorage.setItem('vyonic-auth-user', JSON.stringify({ email: 'user@example.com' }));

  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<PublicRoute><div>login-page</div></PublicRoute>} />
        <Route path="/dashboard" element={<div>dashboard-page</div>} />
      </Routes>
    </MemoryRouter>
  );

  expect(screen.getByText('dashboard-page')).toBeInTheDocument();
  expect(screen.queryByText('login-page')).not.toBeInTheDocument();
});

test('protected route redirects to login when no session exists', () => {
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<ProtectedRoute><div>dashboard-page</div></ProtectedRoute>} />
        <Route path="/login" element={<div>login-page</div>} />
      </Routes>
    </MemoryRouter>
  );

  expect(screen.getByText('login-page')).toBeInTheDocument();
});
