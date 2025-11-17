/**
 * Password Validation Utilities
 * 
 * Enforces strong password requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  // Check minimum length (8 characters)
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password',
    'password123',
    '12345678',
    'qwerty123',
    'abc123456',
    'password1',
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get password strength level
 * Returns: 'weak', 'fair', 'good', 'strong'
 */
export function getPasswordStrength(password: string): string {
  if (!password) return 'weak';

  let strength = 0;

  // Length
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (password.length >= 16) strength++;

  // Character variety
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

  // No repeated characters
  if (!/(.)\1{2,}/.test(password)) strength++;

  if (strength <= 3) return 'weak';
  if (strength <= 5) return 'fair';
  if (strength <= 7) return 'good';
  return 'strong';
}