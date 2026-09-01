import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import DashboardNavbar from './components/Dashboard/DashboardNavbar';

beforeEach(() => {
  document.documentElement.removeAttribute('data-theme');
  window.localStorage.clear();
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
