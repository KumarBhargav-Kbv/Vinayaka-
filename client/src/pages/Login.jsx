import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogIn, Lock, User, Sparkles } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.user, data.token);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAcc = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      background: 'linear-gradient(135deg, #4a0000 0%, #6b0000 50%, #990000 100%)'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        maxWidth: '420px',
        width: '100%',
        padding: '2rem 1.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        border: '3px solid #d4af37'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            fontSize: '3rem',
            background: '#fff8e7',
            width: '80px',
            height: '80px',
            lineHeight: '80px',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            border: '2px solid #d4af37',
            boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)'
          }}>
            🪔
          </div>
          <h2 style={{ fontFamily: 'Cinzel, serif', color: '#6b0000', fontSize: '1.5rem', fontWeight: '800' }}>
            Vinayaka Chavithi
          </h2>
          <p style={{ color: '#e65100', fontWeight: '600', fontSize: '0.9rem', marginTop: '4px' }}>
            Collection Member & Admin Portal
          </p>
        </div>

        {error && (
          <div style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '0.75rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            border: '1px solid #ef9a9a',
            fontWeight: '600'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={16} /> Username
            </label>
            <input 
              type="text" 
              className="form-control"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={16} /> Password
            </label>
            <input 
              type="password" 
              className="form-control"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
            style={{ marginTop: '1rem' }}
          >
            <LogIn size={20} /> {loading ? 'Authenticating...' : 'Login to System'}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div style={{
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px dashed #ebd7a3',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem', fontWeight: '600' }}>
            <Sparkles size={14} color="#d4af37" /> Quick Demo Accounts:
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button 
              type="button" 
              onClick={() => fillQuickAcc('admin', 'admin123')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}
            >
              Admin (admin/admin123)
            </button>
            <button 
              type="button" 
              onClick={() => fillQuickAcc('member', 'member123')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}
            >
              Collector (member/member123)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
