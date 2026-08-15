import { useEffect, useState } from 'react'
import { getMe, type User } from '../api/client'
import { Settings2, LogOut, Shield, Server } from 'lucide-react'

interface Props { token: string; onLogout: () => void }

export default function Settings({ token, onLogout }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [serverUrl, setServerUrl] = useState(localStorage.getItem('ft_server') ?? '')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getMe(token).then(setUser).catch(() => {})
  }, [token])

  const saveServer = () => {
    localStorage.setItem('ft_server', serverUrl)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Account and configuration</p>
      </div>

      <div className="bento-grid">
        {/* Account */}
        <div className="bento-card" style={{ gridColumn: 'span 2' }}>
          <div className="icon-circle">
            <Settings2 size={20} />
          </div>
          <div className="card-title portfolio-card-title">Account</div>
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div className="form-label">Username</div>
                <div style={{ fontWeight: 800, fontSize: 24, fontFamily: 'Montserrat, sans-serif' }}>{user.username}</div>
              </div>
              <div>
                <div className="form-label">Email</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace' }}>{user.email}</div>
              </div>
            </div>
          ) : (
            <div className="spinner" style={{ margin: '16px auto', width: 24, height: 24 }} />
          )}
        </div>

        {/* Server */}
        <div className="bento-card" style={{ gridColumn: 'span 2' }}>
          <div className="icon-circle">
            <Server size={20} />
          </div>
          <div className="card-title portfolio-card-title">Server Connection</div>
          <div className="form-group">
            <label className="form-label">Server URL</label>
            <input
              className="form-input"
              type="url"
              value={serverUrl}
              onChange={e => setServerUrl(e.target.value)}
              placeholder="https://flowtrack.example.com"
            />
          </div>
          {saved && <div className="alert alert-success">Saved!</div>}
          <button className="btn btn-primary" onClick={saveServer}>Save</button>
        </div>

        {/* Privacy */}
        <div className="bento-card" style={{ gridColumn: 'span 2' }}>
          <div className="icon-circle">
            <Shield size={20} />
          </div>
          <div className="card-title portfolio-card-title">Privacy</div>
          <p style={{ fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.7 }}>
            FlowTrack stores your data locally first. Data is only synced to the configured server
            when the agent is running. You control which server receives your data.
          </p>
        </div>

        {/* Sign out */}
        <div className="bento-card highlight" style={{ gridColumn: 'span 2', borderColor: 'var(--color-danger)' }}>
          <div className="icon-circle" style={{ color: 'var(--color-danger)' }}>
            <LogOut size={20} />
          </div>
          <div className="card-title portfolio-card-title">Session</div>
          <button className="btn btn-danger" onClick={onLogout}>
            <LogOut size={15} />Sign out
          </button>
        </div>
      </div>
    </>
  )
}
