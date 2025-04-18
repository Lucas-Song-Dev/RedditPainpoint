import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';
import { AuthProvider } from '../contexts/AuthContext';

// Mock the API module
vi.mock('../api/api.js', () => ({
  getPosts: vi.fn().mockResolvedValue([]),
  createPost: vi.fn().mockResolvedValue({}),
  updatePost: vi.fn().mockResolvedValue({}),
  deletePost: vi.fn().mockResolvedValue({}),
}));

// Mock the AuthContext
vi.mock('../contexts/AuthContext', () => {
  const mockAuthContext = {
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  };

  return {
    useAuth: () => mockAuthContext,
    AuthProvider: ({ children }) => children,
  };
});

describe('App Component', () => {
  const renderApp = () => {
    return render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );
  };

  it('renders without crashing', () => {
    const { container } = renderApp();
    expect(container).toBeTruthy();
  });

  it('renders main content', () => {
    renderApp();
    const mainContent = screen.getByTestId('main-content');
    expect(mainContent).toBeInTheDocument();
  });

  it('renders navigation elements', () => {
    renderApp();
    const navElements = screen.getAllByRole('navigation');
    expect(navElements.length).toBeGreaterThan(0);
  });
}); 