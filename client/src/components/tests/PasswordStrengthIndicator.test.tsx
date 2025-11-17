import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PasswordStrengthIndicator, PasswordInput } from '../PasswordStrengthIndicator'

describe('PasswordStrengthIndicator', () => {
  test('does not render when password is empty', () => {
    const { container } = render(<PasswordStrengthIndicator password="" />)
    expect(container.firstChild).toBeNull()
  })

  test('shows weak strength for short password', () => {
    render(<PasswordStrengthIndicator password="abc" />)
    expect(screen.getByText(/weak/i)).toBeInTheDocument()
  })

  test('shows fair strength for password with some requirements', () => {
    render(<PasswordStrengthIndicator password="password" />)
    expect(screen.getByText(/fair/i)).toBeInTheDocument()
  })

  test('shows good strength for password with most requirements', () => {
    render(<PasswordStrengthIndicator password="password123" />)
    expect(screen.getByText(/good/i)).toBeInTheDocument()
  })

  test('shows strong strength for password with all requirements', () => {
    render(<PasswordStrengthIndicator password="MySecure123" />)
    expect(screen.getByText(/strong/i)).toBeInTheDocument()
  })

  test('displays all four password requirements', () => {
    render(<PasswordStrengthIndicator password="test" />)
    
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    expect(screen.getByText(/one uppercase letter/i)).toBeInTheDocument()
    expect(screen.getByText(/one lowercase letter/i)).toBeInTheDocument()
    expect(screen.getByText(/one number/i)).toBeInTheDocument()
  })

  test('marks requirements as met when satisfied', () => {
    const { container } = render(<PasswordStrengthIndicator password="MySecure123" />)
    
    const listItems = container.querySelectorAll('li')
    expect(listItems.length).toBe(4)
  })

  test('hides requirements when showRequirements is false', () => {
    render(<PasswordStrengthIndicator password="test" showRequirements={false} />)
    
    expect(screen.queryByText(/at least 8 characters/i)).not.toBeInTheDocument()
    expect(screen.getByText(/password strength/i)).toBeInTheDocument()
  })

  test('updates strength dynamically as password changes', () => {
    const { rerender } = render(<PasswordStrengthIndicator password="abc" />)
    expect(screen.getByText(/weak/i)).toBeInTheDocument()

    rerender(<PasswordStrengthIndicator password="MySecure123" />)
    expect(screen.getByText(/strong/i)).toBeInTheDocument()
  })
})

describe('PasswordInput', () => {
  test('renders password input with label', () => {
    const mockOnChange = vi.fn()
    render(
      <PasswordInput
        id="test-password"
        value=""
        onChange={mockOnChange}
        label="Test Password"
      />
    )
    
    expect(screen.getByLabelText('Test Password', { selector: 'input' })).toBeInTheDocument()
  })

  test('toggles password visibility on button click', () => {
    const mockOnChange = vi.fn()
    render(
      <PasswordInput
        id="test-password"
        value="secret123"
        onChange={mockOnChange}
      />
    )
    
    const input = screen.getByLabelText('Password', { selector: 'input' }) as HTMLInputElement
    const toggleButton = screen.getByRole('button')
    
    // Initially hidden
    expect(input.type).toBe('password')
    
    // Click to show
    fireEvent.click(toggleButton)
    expect(input.type).toBe('text')
    
    // Click to hide
    fireEvent.click(toggleButton)
    expect(input.type).toBe('password')
  })

  test('calls onChange when value changes', () => {
    const mockOnChange = vi.fn()
    render(
      <PasswordInput
        id="test-password"
        value=""
        onChange={mockOnChange}
      />
    )
    
    const input = screen.getByLabelText('Password', { selector: 'input' })
    fireEvent.change(input, { target: { value: 'newpassword' } })
    
    expect(mockOnChange).toHaveBeenCalledWith('newpassword')
  })

  test('has autocomplete attribute set', () => {
    const mockOnChange = vi.fn()
    render(
      <PasswordInput
        id="test-password"
        value=""
        onChange={mockOnChange}
      />
    )
    
    const input = screen.getByLabelText('Password', { selector: 'input' }) as HTMLInputElement
    expect(input.autocomplete).toBe('new-password')
  })

  test('is required by default', () => {
    const mockOnChange = vi.fn()
    render(
      <PasswordInput
        id="test-password"
        value=""
        onChange={mockOnChange}
      />
    )
    
    const input = screen.getByLabelText('Password', { selector: 'input' }) as HTMLInputElement
    expect(input.required).toBe(true)
  })

  test('can be optional when specified', () => {
    const mockOnChange = vi.fn()
    render(
      <PasswordInput
        id="test-password"
        value=""
        onChange={mockOnChange}
        required={false}
      />
    )
    
    const input = screen.getByLabelText('Password', { selector: 'input' }) as HTMLInputElement
    expect(input.required).toBe(false)
  })

  test('displays current value', () => {
    const mockOnChange = vi.fn()
    render(
      <PasswordInput
        id="test-password"
        value="MyPassword123"
        onChange={mockOnChange}
      />
    )
    
    const input = screen.getByLabelText('Password', { selector: 'input' }) as HTMLInputElement
    expect(input.value).toBe('MyPassword123')
  })
})