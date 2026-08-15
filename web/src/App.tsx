import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Leaderboard from './pages/Leaderboard'
import Settings from './pages/Settings'
import Layout from './components/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ft_token'))

  useEffect(() => {
    if (token) localStorage.setItem('ft_token', token)
    else localStorage.removeItem('ft_token')
  }, [token])

  const logout = () => setToken(null)

  return (
    <ErrorBoundary>
      <HashRouter>
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
