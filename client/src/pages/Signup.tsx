import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(email, password, name);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '50px auto', padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>Create Account</h2>

      {error && (
        <div style={{ background: '#fee', padding: 12, borderRadius: 6, marginBottom: 16, color: '#c00' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Name (optional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }}
          />
          <small style={{ fontSize: 12, color: '#666' }}>At least 6 characters</small>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 12,
            background: '#5B5FED',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 600
          }}
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14 }}>
        Already have an account? <Link to="/login" style={{ color: '#5B5FED' }}>Login</Link>
      </p>
    </div>
  );
}