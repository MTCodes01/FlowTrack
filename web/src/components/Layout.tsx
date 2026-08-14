import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Trophy, Settings, Zap, LogOut } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
  onLogout: () => void
}

export default function Layout({ children, onLogout }: LayoutProps) {
  const location = useLocation()

  const navItems = [
    { to: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
    { to: '/leaderboard', label: 'Leaderboard',  icon: Trophy },
    { to: '/settings',    label: 'Settings',     icon: Settings },
  ]

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <Zap size={22} color="#6c63ff" fill="#6c63ff" />
          Flow<span>Track</span>
        </div>

        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={`nav-item ${location.pathname === to ? 'active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        <div style={{ flex: 1 }} />

        <button className="nav-item btn-ghost" onClick={onLogout} style={{ border: 'none', cursor: 'pointer', width: '100%' }}>
          <LogOut size={16} />
          Sign out
        </button>
      </nav>

      <main className="main-content">{children}</main>
    </div>
  )
}
