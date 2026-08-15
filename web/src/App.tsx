import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Leaderboard from './pages/Leaderboard'
import Settings from './pages/Settings'
import Layout from './components/Layout'

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ft_token'))

  useEffect(() => {
    if (token) localStorage.setItem('ft_token', token)
    else localStorage.removeItem('ft_token')
  }, [token])

  const logout = () => setToken(null)

  return (
    <HashRouter>
      {!token ? (
        <Routes>
          <Route path="*" element={<Login onLogin={setToken} />} />
        </Routes>
      ) : (
        <Layout onLogout={logout}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard token={token} />} />
            <Route path="/leaderboard" element={<Leaderboard token={token} />} />
            <Route path="/settings" element={<Settings token={token} onLogout={logout} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      )}
    </HashRouter>
  )
}

export default App
