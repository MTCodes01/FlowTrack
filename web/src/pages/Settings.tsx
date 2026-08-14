import { useEffect, useState } from 'react'
import { getMe, type User } from '../api/client'
import { Settings2, LogOut, Shield } from 'lucide-react'

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
        <h1><Settings2 size={22} style={{ verticalAlign: 'middle', marginRight: 8 }} />Settings</h1>
        <p>Account and application configuration</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>
        {/* Account */}
        <div className="card">
          <div className="card-title">Account</div>
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 2 }}>Username</div>
                <div style={{ fontWeight: 600 }}>{user.username}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 2 }}>Email</div>
                <div>{user.email}</div>
              </div>
            </div>
          ) : (
            <div className="spinner" style={{ margin: '16px auto', width: 24, height: 24 }} />
          )}
        </div>

        {/* Server */}
        <div className="card">
          <div className="card-title">Server Connection</div>
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
        <div className="card">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={14} />Privacy
          </div>
          <p style={{ fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.7 }}>
            FlowTrack stores your data locally first. Data is only synced to the configured server
            when the agent is running. You control which server receives your data.
          </p>
        </div>

        {/* Sign out */}
        <div className="card">
          <div className="card-title">Session</div>
          <button className="btn btn-danger" onClick={onLogout}>
            <LogOut size={15} />Sign out
          </button>
        </div>
      </div>
    </>
  )
}
