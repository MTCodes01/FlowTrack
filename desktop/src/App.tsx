import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import Dashboard from '../../web/src/pages/Dashboard'
import Leaderboard from '../../web/src/pages/Leaderboard'
import Settings from '../../web/src/pages/Settings'
import Login from '../../web/src/pages/Login'
import Layout from '../../web/src/components/Layout'

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
    <HashRouter>
      {!token ? (
        <Routes>
          <Route path="*" element={<Login onLogin={setToken} />} />
        </Routes>
      ) : (
        <Layout onLogout={logout}>
          {!agentRunning && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              ⚠️ FlowTrack agent is not running. Application tracking is paused.
            </div>
          )}
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"   element={<Dashboard   token={token} />} />
            <Route path="/leaderboard" element={<Leaderboard token={token} />} />
            <Route path="/settings"    element={<Settings    token={token} onLogout={logout} />} />
            <Route path="*"            element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      )}
    </HashRouter>
  )
}

export default App
