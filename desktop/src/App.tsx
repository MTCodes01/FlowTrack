import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import Dashboard from '../../web/src/pages/Dashboard'
import Leaderboard from '../../web/src/pages/Leaderboard'
import Settings from '../../web/src/pages/Settings'
import Login from '../../web/src/pages/Login'
import Layout from '../../web/src/components/Layout'
import { ErrorBoundary } from '../../web/src/components/ErrorBoundary'

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ft_token'))
  const [agentRunning, setAgentRunning] = useState(false)

  // Check if the background agent is running
  useEffect(() => {
    invoke<boolean>('is_agent_running')
      .then(setAgentRunning)
      .catch(() => setAgentRunning(false))
  }, [])

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
          <Route path="/login" element={!token ? <Login onLogin={setToken} /> : <Navigate to="/dashboard" replace />} />
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
