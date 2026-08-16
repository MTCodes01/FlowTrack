import { useState } from 'react'
import { login, register, type AuthResponse } from '../api/client'

interface Props {
  onLogin: (token: string) => void
}

export default function Login({ onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [serverUrl, setServerUrl] = useState(() => localStorage.getItem('ft_server') || '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    if (serverUrl) {
      localStorage.setItem('ft_server', serverUrl)
    } else {
      localStorage.removeItem('ft_server')
    }

    try {
      let data: AuthResponse
      if (mode === 'login') {
        data = await login(username, password)
      } else {
        data = await register(username, email, password)
      }
      onLogin(data.token)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <img src="/app-icon.png" alt="FlowTrack Logo" width="32" height="32" style={{ borderRadius: 6 }} />
          Flow<span>Track</span>
        </div>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="yourname"
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="••••••••"
            />
          </div>

          <div className="form-group" style={{ marginTop: 24, padding: '16px', backgroundColor: 'var(--color-bg-light)', borderRadius: 8 }}>
            <label className="form-label" style={{ fontSize: 13, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span>Server URL (Optional)</span>
            </label>
            <input
              className="form-input"
              type="url"
              value={serverUrl}
              onChange={e => setServerUrl(e.target.value)}
              placeholder="http://localhost:27943"
              style={{ fontSize: 13 }}
            />
            <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 8 }}>
              Leave empty to use the default server.
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--color-muted)' }}>
          {mode === 'login'
            ? <>Don't have an account?{' '}<button className="btn" style={{ padding: 0, background: 'none', color: 'var(--color-accent)' }} onClick={() => setMode('register')}>Register</button></>
            : <>Already have an account?{' '}<button className="btn" style={{ padding: 0, background: 'none', color: 'var(--color-accent)' }} onClick={() => setMode('login')}>Sign in</button></>
          }
        </div>
      </div>
    </div>
  )
}
