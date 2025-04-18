import { render, screen } from '@testing-library/react'
import App from '../App'

test('renders app without crashing', () => {
  render(<App />)
  const appElement = screen.getByTestId('app')
  expect(appElement).toBeInTheDocument()
})

test('renders main content', () => {
  render(<App />)
  const mainContent = screen.getByTestId('main-content')
  expect(mainContent).toBeInTheDocument()
}) 