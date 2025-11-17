import { useMemo } from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

interface PasswordRequirement {
  met: boolean;
  text: string;
}

export function PasswordStrengthIndicator({ 
  password, 
  showRequirements = true 
}: PasswordStrengthIndicatorProps) {
  // Check password requirements
  const requirements: PasswordRequirement[] = useMemo(() => {
    return [
      {
        met: password.length >= 8,
        text: 'At least 8 characters',
      },
      {
        met: /[A-Z]/.test(password),
        text: 'One uppercase letter',
      },
      {
        met: /[a-z]/.test(password),
        text: 'One lowercase letter',
      },
      {
        met: /[0-9]/.test(password),
        text: 'One number',
      },
    ];
  }, [password]);

  // Calculate strength
  const strength = useMemo(() => {
    if (!password) return { level: 0, label: '', color: '' };

    const metCount = requirements.filter((r) => r.met).length;
    let level = 0;
    let label = '';
    let color = '';

    if (metCount === 0) {
      level = 0;
      label = '';
      color = '';
    } else if (metCount <= 1) {
      level = 25;
      label = 'Weak';
      color = '#ef4444';
    } else if (metCount === 2) {
      level = 50;
      label = 'Fair';
      color = '#f97316';
    } else if (metCount === 3) {
      level = 75;
      label = 'Good';
      color = '#eab308';
    } else {
      level = 100;
      label = 'Strong';
      color = '#22c55e';
    }

    return { level, label, color };
  }, [requirements, password]);

  if (!password) return null;

  return (
    <div style={{ marginTop: 8 }}>
      {/* Strength Bar */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: 12,
          marginBottom: 4
        }}>
          <span style={{ color: '#666' }}>Password strength</span>
          {strength.label && (
            <span style={{ 
              fontWeight: 600,
              color: strength.color
            }}>
              {strength.label}
            </span>
          )}
        </div>
        <div style={{ 
          height: 8, 
          background: '#e5e7eb', 
          borderRadius: 4,
          overflow: 'hidden'
        }}>
          <div
            style={{
              height: '100%',
              width: `${strength.level}%`,
              background: strength.color,
              transition: 'all 0.3s ease'
            }}
          />
        </div>
      </div>

      {/* Requirements List */}
      {showRequirements && (
        <ul style={{ 
          listStyle: 'none', 
          padding: 0, 
          margin: 0,
          fontSize: 12
        }}>
          {requirements.map((req, index) => (
            <li
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 4,
                color: req.met ? '#22c55e' : '#9ca3af'
              }}
            >
              {req.met ? (
                <svg
                  style={{ width: 16, height: 16, flexShrink: 0 }}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  style={{ width: 16, height: 16, flexShrink: 0 }}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span>{req.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Password input with show/hide toggle
interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
}

export function PasswordInput({ id, value, onChange, label = 'Password', required = true }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete="new-password"
          style={{ 
            width: '100%', 
            padding: 10, 
            paddingRight: 40,
            border: '1px solid #ddd', 
            borderRadius: 6 
          }}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#666',
            padding: 0,
            display: 'flex',
            alignItems: 'center'
          }}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          ) : (
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

// Add missing import
import { useState } from 'react';