import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Trophy, Settings, LogOut, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'

interface LayoutProps {
  children: React.ReactNode
  onLogout: () => void
}

export default function Layout({ children, onLogout }: LayoutProps) {
  const location = useLocation()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true'
  })
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', isSidebarCollapsed.toString())
    if (isSidebarCollapsed) {
      document.body.classList.add('sidebar-collapsed')
    } else {
      document.body.classList.remove('sidebar-collapsed')
    }
  }, [isSidebarCollapsed])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const navItems = [
    { to: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
    { to: '/leaderboard', label: 'Leaderboard',  icon: Trophy },
    { to: '/settings',    label: 'Settings',     icon: Settings },
  ]

  return (
    <div className="layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="sidebar-logo" style={{ padding: 0, margin: 0, fontSize: '1.25rem' }}>
          <img src="/app-icon.png" alt="FlowTrack Logo" width="24" height="24" />
          <span style={{ color: 'var(--color-text)', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>FlowTrack</span>
        </div>
        <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div 
          className="sidebar-logo" 
          onClick={() => {
            if (window.innerWidth > 768) {
              setIsSidebarCollapsed(!isSidebarCollapsed)
            }
          }}
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <img src="/app-icon.png" alt="FlowTrack Logo" width="24" height="24" style={{ minWidth: 24 }} />
          <span className="sidebar-logo-text" style={{ color: 'var(--color-text)', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>FlowTrack</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginTop: '1rem' }}>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={`nav-item ${location.pathname === to ? 'active' : ''}`}
              title={isSidebarCollapsed ? label : undefined}
            >
              <Icon size={18} style={{ minWidth: 18 }} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            className="nav-item btn-ghost" 
            onClick={onLogout} 
            style={{ border: 'none', cursor: 'pointer', width: '100%', background: 'transparent', color: 'var(--color-danger)' }}
            title={isSidebarCollapsed ? "Sign out" : undefined}
          >
            <LogOut size={18} style={{ minWidth: 18 }} />
            <span>Sign out</span>
          </button>
        </div>
      </nav>

      <main className="main-content">{children}</main>
    </div>
  )
}
