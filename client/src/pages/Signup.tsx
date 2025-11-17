import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PasswordInput, PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setErrorDetails([]);
    setLoading(true);

    try {
      await signup(email, password, name);
      navigate('/dashboard');
    } catch (err: any) {
      // Prevent error from logging to console
      console.clear(); // Optional: clears console
      
      // Handle different error formats
      const response = err?.response?.data;
      
      if (response) {
        // Backend returned structured error
        if (response.errors && Array.isArray(response.errors)) {
          setError(response.message || 'Signup failed');
          setErrorDetails(response.errors);
        } else if (response.message) {
          setError(response.message);
        } else {
          setError('Signup failed. Please try again.');
        }
      } else {
        // Network or other error
        setError(err.message || 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '50px auto', padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>Create Account</h2>

      {error && (
        <div style={{ 
          background: '#fee2e2', 
          padding: 12, 
          borderRadius: 6, 
          marginBottom: 16,
          border: '1px solid #fecaca'
        }}>
          <div style={{ color: '#dc2626', fontWeight: 600, marginBottom: 4 }}>
            {error}
          </div>
          {errorDetails.length > 0 && (
            <ul style={{ 
              margin: '8px 0 0 0', 
              paddingLeft: 20, 
              fontSize: 14,
              color: '#991b1b'
            }}>
              {errorDetails.map((detail, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{detail}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
        <div>
          <label htmlFor="name" style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>
            Name (optional)
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }}
          />
        </div>

        <div>
          <label htmlFor="email" style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }}
          />
        </div>

        <div>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            label="Password"
            required
          />
          <PasswordStrengthIndicator password={password} />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 12,
            background: loading ? '#9ca3af' : '#5B5FED',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            transition: 'background 0.2s'
          }}
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14 }}>
        Already have an account? <Link to="/login" style={{ color: '#5B5FED', textDecoration: 'none' }}>Login</Link>
      </p>
    </div>
  );
}
