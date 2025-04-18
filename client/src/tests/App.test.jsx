import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock the useAuth hook directly
vi.mock('../App', async () => {
  const actual = await vi.importActual('../App');
  return {
    ...actual,
    useAuth: () => ({
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    }),
  };
});

describe('App Component', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it('renders main content', () => {
    render(<App />);
    const mainContent = screen.getByTestId('main-content');
    expect(mainContent).toBeInTheDocument();
  });

  it('renders navigation elements', () => {
    render(<App />);
    const navElements = screen.getAllByRole('navigation');
    expect(navElements.length).toBeGreaterThan(0);
  });
}); 