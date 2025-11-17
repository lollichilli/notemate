import { validatePassword, getPasswordStrength } from '../utils/passwordValidator';

describe('Password Validator', () => {
  describe('validatePassword', () => {
    it('should accept strong password', () => {
      const result = validatePassword('MySecure123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password under 8 characters', () => {
      const result = validatePassword('Pass12');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password without uppercase', () => {
      const result = validatePassword('password123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase', () => {
      const result = validatePassword('PASSWORD123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const result = validatePassword('Password');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject common passwords', () => {
      const commonPasswords = ['password123', '12345678', 'qwerty123'];
      
      commonPasswords.forEach(pwd => {
        const result = validatePassword(pwd);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password is too common. Please choose a stronger password');
      });
    });

    it('should return multiple errors for very weak password', () => {
      const result = validatePassword('abc');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should handle empty password', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should accept password with special characters', () => {
      const result = validatePassword('MySecure123!@#');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('getPasswordStrength', () => {
    it('should return "weak" for short passwords', () => {
      expect(getPasswordStrength('abc')).toBe('weak');
      expect(getPasswordStrength('test')).toBe('weak');
    });

    it('should return "fair" for passwords meeting some requirements', () => {
      expect(getPasswordStrength('Password')).toBe('fair');
      expect(getPasswordStrength('password123')).toBe('fair');
    });

    it('should return "good" for passwords meeting most requirements', () => {
      expect(getPasswordStrength('MyPassword123')).toBe('good');
    });

    it('should return "strong" for excellent passwords', () => {
      expect(getPasswordStrength('MyVerySecure123!Password')).toBe('strong');
    });

    it('should return "weak" for empty string', () => {
      expect(getPasswordStrength('')).toBe('weak');
    });
  });
});