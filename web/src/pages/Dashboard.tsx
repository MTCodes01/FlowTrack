import { useEffect, useState } from 'react'
import { getDailyStats, getWeeklyStats, type AppStat } from '../api/client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props { token: string }

function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export default function Dashboard({ token }: Props) {
  const [daily, setDaily] = useState<AppStat[]>([])
  const [weekly, setWeekly] = useState<AppStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getDailyStats(token), getWeeklyStats(token)])
      .then(([d, w]) => { setDaily(d); setWeekly(w) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  const totalToday = daily.reduce((sum, s) => sum + s.total_seconds, 0)
  const totalWeek = weekly.reduce((sum, s) => sum + s.total_seconds, 0)
  const topApp = daily[0]?.app_name ?? '—'
  const maxSeconds = daily[0]?.total_seconds ?? 1

  const COLORS = ['#6c63ff','#4f46e5','#7c3aed','#9333ea','#a855f7']

  if (loading) return <div className="spinner" />
  if (error) return <div className="alert alert-error">{error}</div>

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Your application usage at a glance</p>
      </div>

      {/* Stat tiles */}
      <div className="stat-grid">
        <div className="stat-tile">
          <div className="stat-tile-label">Today</div>
          <div className="stat-tile-value">{formatTime(totalToday)}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-label">This week</div>
          <div className="stat-tile-value">{formatTime(totalWeek)}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-label">Top app today</div>
          <div className="stat-tile-value" style={{ fontSize: 20 }}>{topApp}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile-label">Apps tracked</div>
          <div className="stat-tile-value">{daily.length}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Today's top apps */}
        <div className="card">
          <div className="card-title">Today's Usage</div>
          {daily.length === 0
            ? <div className="empty-state"><h3>No data yet</h3><p>Start the agent to begin tracking</p></div>
            : daily.slice(0, 8).map(app => (
              <div className="app-bar-row" key={app.app_name}>
                <div className="app-bar-label">{app.app_name}</div>
                <div className="app-bar-track">
                  <div className="app-bar-fill" style={{ width: `${(app.total_seconds / maxSeconds) * 100}%` }} />
                </div>
                <div className="app-bar-time">{formatTime(app.total_seconds)}</div>
              </div>
            ))
          }
        </div>

        {/* Weekly bar chart */}
        <div className="card">
          <div className="card-title">Weekly Breakdown</div>
          {weekly.length === 0
            ? <div className="empty-state"><h3>No data yet</h3></div>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weekly.slice(0, 10)} margin={{ top: 0, right: 0, bottom: 24, left: 0 }}>
                  <XAxis dataKey="app_name" tick={{ fontSize: 11, fill: '#64748b' }} angle={-30} textAnchor="end" />
                  <YAxis tickFormatter={v => formatTime(v as number)} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(v) => [formatTime(v as number), 'Time']}
                    contentStyle={{ background: '#141720', border: '1px solid #252a3a', borderRadius: 8 }}
                    labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                  />
                  <Bar dataKey="total_seconds" radius={[4,4,0,0]}>
                    {weekly.slice(0, 10).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>
    </>
  )
}
