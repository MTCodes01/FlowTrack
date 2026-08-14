import { useState } from 'react'
import { login, register, type AuthResponse } from '../api/client'
import { Zap } from 'lucide-react'

interface Props {
  onLogin: (token: string) => void
}

export default function Login({ onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
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
        <div className="auth-logo">
          <Zap size={28} color="#6c63ff" fill="#6c63ff" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
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

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
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
