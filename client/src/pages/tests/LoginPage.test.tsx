import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '../Login'

const mockLogin = vi.fn()

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    login: mockLogin,
    logout: vi.fn(),
  }),
}))

describe('Login Page', () => {
  beforeEach(() => {
    mockLogin.mockReset()
  })

  test('renders login form and handles submit', async () => {
    mockLogin.mockResolvedValue(undefined)

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    const email = screen.getByLabelText(/email/i)
    const password = screen.getByLabelText(/password/i)
    const submit = screen.getByRole('button', { name: /login/i })

    expect(email).toBeInTheDocument()
    expect(password).toBeInTheDocument()

    fireEvent.change(email, { target: { value: 'user@example.com' } })
    fireEvent.change(password, { target: { value: 'secret123' } })
    fireEvent.click(submit)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'secret123')
    })
  })

  test('displays email and password in inputs', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    const email = screen.getByLabelText(/email/i) as HTMLInputElement
    const password = screen.getByLabelText(/password/i) as HTMLInputElement

    fireEvent.change(email, { target: { value: 'test@example.com' } })
    fireEvent.change(password, { target: { value: 'mypassword' } })

    expect(email.value).toBe('test@example.com')
    expect(password.value).toBe('mypassword')
  })
})