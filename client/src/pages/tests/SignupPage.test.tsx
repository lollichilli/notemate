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
    expect(screen.getByLabelText('Password', { selector: 'input' })).toBeInTheDocument()
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
    const passwordInput = screen.getByLabelText('Password', { selector: 'input' }) as HTMLInputElement

    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'TestPass123' } })

    expect(nameInput.value).toBe('John Doe')
    expect(emailInput.value).toBe('john@example.com')
    expect(passwordInput.value).toBe('TestPass123')
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
    const passwordInput = screen.getByLabelText('Password', { selector: 'input' })
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'TestPass123' } })

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('john@example.com', 'TestPass123', 'John Doe')
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
    fireEvent.change(screen.getByLabelText('Password', { selector: 'input' }), { target: { value: 'TestPass123' } })
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
    fireEvent.change(screen.getByLabelText('Password', { selector: 'input' }), { target: { value: 'TestPass123' } })
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
    const passwordInput = screen.getByLabelText('Password', { selector: 'input' }) as HTMLInputElement

    expect(nameInput.value).toBe('')
    expect(emailInput.value).toBe('')
    expect(passwordInput.value).toBe('')
  })

  // ========================================
  // NEW PASSWORD VALIDATION TESTS
  // ========================================

  describe('Password Strength Indicator', () => {
    test('shows password strength indicator when typing password', () => {
      render(
        <MemoryRouter>
          <Signup />
        </MemoryRouter>
      )

      const passwordInput = screen.getByLabelText('Password', { selector: 'input' })
      
      // Initially no strength indicator
      expect(screen.queryByText(/password strength/i)).not.toBeInTheDocument()

      // Type password
      fireEvent.change(passwordInput, { target: { value: 'test' } })

      // Now strength indicator appears
      expect(screen.getByText(/password strength/i)).toBeInTheDocument()
    })

    test('shows weak strength for short password', () => {
      render(
        <MemoryRouter>
          <Signup />
        </MemoryRouter>
      )

      const passwordInput = screen.getByLabelText('Password', { selector: 'input' })
      fireEvent.change(passwordInput, { target: { value: 'abc' } })

      expect(screen.getByText(/weak/i)).toBeInTheDocument()
    })

    test('shows strong strength for good password', () => {
      render(
        <MemoryRouter>
          <Signup />
        </MemoryRouter>
      )

      const passwordInput = screen.getByLabelText('Password', { selector: 'input' })
      fireEvent.change(passwordInput, { target: { value: 'MySecure123' } })

      expect(screen.getByText(/strong/i)).toBeInTheDocument()
    })

    test('shows all password requirements', () => {
      render(
        <MemoryRouter>
          <Signup />
        </MemoryRouter>
      )

      const passwordInput = screen.getByLabelText('Password', { selector: 'input' })
      fireEvent.change(passwordInput, { target: { value: 'test' } })

      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
      expect(screen.getByText(/one uppercase letter/i)).toBeInTheDocument()
      expect(screen.getByText(/one lowercase letter/i)).toBeInTheDocument()
      expect(screen.getByText(/one number/i)).toBeInTheDocument()
    })

    test('updates requirements as user types', () => {
      render(
        <MemoryRouter>
          <Signup />
        </MemoryRouter>
      )

      const passwordInput = screen.getByLabelText('Password', { selector: 'input' })

      // Start with weak password
      fireEvent.change(passwordInput, { target: { value: 'abc' } })
      expect(screen.getByText(/weak/i)).toBeInTheDocument()

      // Improve to strong password
      fireEvent.change(passwordInput, { target: { value: 'MySecure123' } })
      expect(screen.getByText(/strong/i)).toBeInTheDocument()
    })
  })

  describe('Password Show/Hide Toggle', () => {
    test('toggles password visibility', () => {
      render(
        <MemoryRouter>
          <Signup />
        </MemoryRouter>
      )

      const passwordInput = screen.getByLabelText('Password', { selector: 'input' }) as HTMLInputElement
      const toggleButton = screen.getByLabelText(/show password|hide password/i)

      // Initially password is hidden
      expect(passwordInput.type).toBe('password')

      // Click to show
      fireEvent.click(toggleButton)
      expect(passwordInput.type).toBe('text')

      // Click to hide again
      fireEvent.click(toggleButton)
      expect(passwordInput.type).toBe('password')
    })
  })

  describe('Password Validation Errors', () => {
    test('displays password validation errors from backend', async () => {
      const error: any = new Error('Password validation failed')
      error.response = {
        data: {
          message: 'Password does not meet requirements',
          errors: [
            'Password must be at least 8 characters long',
            'Password must contain at least one uppercase letter'
          ]
        }
      }
      mockSignup.mockRejectedValue(error)

      render(
        <MemoryRouter>
          <Signup />
        </MemoryRouter>
      )

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByLabelText('Password', { selector: 'input' }), { target: { value: 'weak' } })
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => {
        expect(screen.getByText(/password does not meet requirements/i)).toBeInTheDocument()
        expect(screen.getByText(/password must be at least 8 characters long/i)).toBeInTheDocument()
        expect(screen.getByText(/password must contain at least one uppercase letter/i)).toBeInTheDocument()
      })
    })

    test('displays user already exists error', async () => {
      const error: any = new Error('User exists')
      error.response = {
        data: {
          message: 'User already exists'
        }
      }
      mockSignup.mockRejectedValue(error)

      render(
        <MemoryRouter>
          <Signup />
        </MemoryRouter>
      )

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'existing@test.com' } })
      fireEvent.change(screen.getByLabelText('Password', { selector: 'input' }), { target: { value: 'MySecure123' } })
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => {
        expect(screen.getByText(/user already exists/i)).toBeInTheDocument()
      })
    })

    test('clears error when user starts typing again', async () => {
      const error: any = new Error('Error')
      error.response = {
        data: {
          message: 'Signup failed'
        }
      }
      mockSignup.mockRejectedValue(error)

      render(
        <MemoryRouter>
          <Signup />
        </MemoryRouter>
      )

      // Trigger error
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
      fireEvent.change(screen.getByLabelText('Password', { selector: 'input' }), { target: { value: 'TestPass123' } })
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => {
        expect(screen.getByText(/signup failed/i)).toBeInTheDocument()
      })

      // Type again - error should clear (if your component clears on change)
      mockSignup.mockResolvedValue(undefined)
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@test.com' } })
      
      // Submit again - should work now
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      })
    })
  })
})