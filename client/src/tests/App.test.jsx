import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock the API module
vi.mock('@/api/api.js', () => ({
  getPosts: vi.fn().mockResolvedValue([]),
  createPost: vi.fn().mockResolvedValue({}),
  updatePost: vi.fn().mockResolvedValue({}),
  deletePost: vi.fn().mockResolvedValue({}),
}));

// Mock the useAuth hook
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

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