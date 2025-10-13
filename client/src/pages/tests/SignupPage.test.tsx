import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Signup from '../Signup'

const mockSignup = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    signup: mockSignup,
    logout: vi.fn(),
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Signup Page', () => {
  beforeEach(() => {
    mockSignup.mockReset()
    mockNavigate.mockReset()
  })

  test('renders signup form with all fields', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  test('allows user to type in all input fields', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement

    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    expect(nameInput.value).toBe('John Doe')
    expect(emailInput.value).toBe('john@example.com')
    expect(passwordInput.value).toBe('password123')
  })

  test('calls signup function with correct parameters on submit', async () => {
    mockSignup.mockResolvedValue(undefined)

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    const nameInput = screen.getByLabelText(/name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('john@example.com', 'password123', 'John Doe')
    })

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  test('displays error message when signup fails', async () => {
    mockSignup.mockRejectedValue(new Error('Email already exists'))

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test('shows loading state during signup', async () => {
    mockSignup.mockImplementation(() => new Promise(() => {}))

    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    const submitButton = screen.getByRole('button', { name: /sign up/i })

    expect(submitButton).toHaveTextContent('Sign Up')

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(submitButton).toHaveTextContent('Creating account...')
      expect(submitButton).toBeDisabled()
    })
  })

  test('shows link to login page', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    const loginLink = screen.getByText(/already have an account/i)
    expect(loginLink).toBeInTheDocument()
    
    const link = screen.getByRole('link', { name: /login/i })
    expect(link).toHaveAttribute('href', '/login')
  })

  test('form fields are initially empty', () => {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement

    expect(nameInput.value).toBe('')
    expect(emailInput.value).toBe('')
    expect(passwordInput.value).toBe('')
  })
})