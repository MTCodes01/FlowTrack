import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { enable, isEnabled } from '@tauri-apps/plugin-autostart'
import Dashboard from '../../web/src/pages/Dashboard'
import Leaderboard from '../../web/src/pages/Leaderboard'
import Settings from '../../web/src/pages/Settings'
import Login from '../../web/src/pages/Login'
import Layout from '../../web/src/components/Layout'
import { ErrorBoundary } from '../../web/src/components/ErrorBoundary'

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ft_token'))
  const [agentRunning, setAgentRunning] = useState(false)

  // Manage background agent lifecycle based on auth state
  useEffect(() => {
    if (token) {
      const serverUrl = localStorage.getItem('ft_server') || import.meta.env.VITE_API_URL || 'http://localhost:27943'
      invoke('start_agent', { serverUrl, token })
        .then(() => setAgentRunning(true))
        .catch(err => {
          console.error('Failed to start agent:', err)
          setAgentRunning(false)
        })
    } else {
      invoke('stop_agent')
        .then(() => setAgentRunning(false))
        .catch(console.error)
    }
  }, [token])

  useEffect(() => {
    const initAutostart = async () => {
      try {
        if (!(await isEnabled())) {
          await enable();
        }
      } catch (err) {
        console.error('Failed to enable autostart:', err);
      }
    };
    initAutostart();
  }, []);

  const logout = () => {
    localStorage.removeItem('ft_token')
    setToken(null)
  }

  return (
    <ErrorBoundary>
      <HashRouter>
        {token && !agentRunning && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            ⚠️ FlowTrack agent is not running. Application tracking is paused.
          </div>
        )}
        <Routes>
          <Route path="/login" element={!token ? <Login onLogin={(t) => { localStorage.setItem('ft_token', t); setToken(t); }} /> : <Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={token ? <Layout onLogout={logout}><Dashboard token={token!} /></Layout> : <Navigate to="/login" replace />} />
          <Route path="/leaderboard" element={token ? <Layout onLogout={logout}><Leaderboard token={token!} /></Layout> : <Navigate to="/login" replace />} />
          <Route path="/settings" element={token ? <Layout onLogout={logout}><Settings token={token!} onLogout={logout} /></Layout> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}

export default App
