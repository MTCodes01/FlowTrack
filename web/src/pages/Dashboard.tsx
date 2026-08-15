import { useEffect, useState, useRef } from 'react'
import { getDailyStats, getWeeklyStats, getHeatmapStats, type AppStat, type HeatmapStat } from '../api/client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ChevronDown, Clock, Activity, Layers, Calendar } from 'lucide-react'

interface Props { token: string }

function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function formatYYYYMMDD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface HoveredCellInfo {
  date: string
  formattedDate: string
  seconds: number
  count: number
  topApps: { name: string; seconds: number; count: number }[]
  totalAppsCount: number
  x: number
  y: number
}

interface DateFilterPreset {
  id: string
  label: string
  shortcut: string
  getRange: (now: Date) => { start: string; end: string }
}

const PRESETS: DateFilterPreset[] = [
  {
    id: 'today',
    label: 'Today',
    shortcut: 'D',
    getRange: (now) => {
      const dStr = formatYYYYMMDD(now)
      return { start: dStr, end: dStr }
    }
  },
  {
    id: 'yesterday',
    label: 'Yesterday',
    shortcut: 'E',
    getRange: (now) => {
      const y = new Date(now)
      y.setDate(now.getDate() - 1)
      const dStr = formatYYYYMMDD(y)
      return { start: dStr, end: dStr }
    }
  },
  {
    id: 'this_week',
    label: 'This Week',
    shortcut: 'W',
    getRange: (now) => {
      const day = now.getDay()
      const diff = day === 0 ? 6 : day - 1
      const start = new Date(now)
      start.setDate(now.getDate() - diff)
      return { start: formatYYYYMMDD(start), end: formatYYYYMMDD(now) }
    }
  },
  {
    id: 'this_month',
    label: 'This Month',
    shortcut: 'M',
    getRange: (now) => {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: formatYYYYMMDD(start), end: formatYYYYMMDD(now) }
    }
  },
  {
    id: 'this_year',
    label: 'This Year',
    shortcut: 'Y',
    getRange: (now) => {
      const start = new Date(now.getFullYear(), 0, 1)
      return { start: formatYYYYMMDD(start), end: formatYYYYMMDD(now) }
    }
  },
  {
    id: 'past_7_days',
    label: 'Past 7 Days',
    shortcut: '1',
    getRange: (now) => {
      const start = new Date(now)
      start.setDate(now.getDate() - 6)
      return { start: formatYYYYMMDD(start), end: formatYYYYMMDD(now) }
    }
  },
  {
    id: 'past_30_days',
    label: 'Past 30 Days',
    shortcut: '2',
    getRange: (now) => {
      const start = new Date(now)
      start.setDate(now.getDate() - 29)
      return { start: formatYYYYMMDD(start), end: formatYYYYMMDD(now) }
    }
  },
  {
    id: 'past_6_months',
    label: 'Past 6 Months',
    shortcut: '3',
    getRange: (now) => {
      const start = new Date(now)
      start.setMonth(now.getMonth() - 6)
      return { start: formatYYYYMMDD(start), end: formatYYYYMMDD(now) }
    }
  },
  {
    id: 'past_12_months',
    label: 'Past 12 Months',
    shortcut: '4',
    getRange: (now) => {
      const start = new Date(now)
      start.setFullYear(now.getFullYear() - 1)
      return { start: formatYYYYMMDD(start), end: formatYYYYMMDD(now) }
    }
  },
  {
    id: 'all_time',
    label: 'All Time',
    shortcut: 'A',
    getRange: () => {
      return { start: '1970-01-01', end: '2099-12-31' }
    }
  }
]

export default function Dashboard({ token }: Props) {
  const [heatmap, setHeatmap] = useState<HeatmapStat[]>([])
  const [daily, setDaily] = useState<AppStat[]>([])
  const [, setWeekly] = useState<AppStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedApp, setSelectedApp] = useState<string>('All Apps')
  const [metricMode, setMetricMode] = useState<'time' | 'frequency'>('time')
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false)
  const [hoveredCell, setHoveredCell] = useState<HoveredCellInfo | null>(null)
  const appMenuRef = useRef<HTMLDivElement>(null)

  // Date Filter State
  const [selectedPreset, setSelectedPreset] = useState<DateFilterPreset>(PRESETS[3]) // Default: This Month
  const [activeRange, setActiveRange] = useState<{ start: string; end: string }>(() => {
    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    return PRESETS[3].getRange(nowIST)
  })
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const dateFilterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hData, dData, wData] = await Promise.all([
          getHeatmapStats(token),
          getDailyStats(token),
          getWeeklyStats(token)
        ])
        setHeatmap(hData || [])
        setDaily(dData || [])
        setWeekly(wData || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [token])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (appMenuRef.current && !appMenuRef.current.contains(e.target as Node)) {
        setIsAppMenuOpen(false)
      }
      if (dateFilterRef.current && !dateFilterRef.current.contains(e.target as Node)) {
        setIsDateFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcuts for presets (D, E, W, M, Y, 1, 2, 3, 4, A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return
      
      const key = e.key.toUpperCase()
      const match = PRESETS.find(p => p.shortcut === key)
      if (match) {
        const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
        setSelectedPreset(match)
        setActiveRange(match.getRange(nowIST))
        setIsDateFilterOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSelectPreset = (preset: DateFilterPreset) => {
    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    setSelectedPreset(preset)
    setActiveRange(preset.getRange(nowIST))
    setIsDateFilterOpen(false)
  }

  const handleApplyCustom = () => {
    if (!customStart || !customEnd) return
    setSelectedPreset({
      id: 'custom',
      label: 'Custom Range',
      shortcut: '',
      getRange: () => ({ start: customStart, end: customEnd })
    })
    setActiveRange({ start: customStart, end: customEnd })
    setIsDateFilterOpen(false)
  }

  const COLORS = [
    '#bdf522', // Neon Lime
    '#0ea5e9', // Sky Blue
    '#ec4899', // Pink
    '#8b5cf6', // Purple
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#f43f5e', // Rose
    '#3b82f6', // Blue
    '#84cc16', // Lime
    '#d946ef', // Fuchsia
    '#14b8a6', // Teal
    '#f97316'  // Orange
  ]

  const totalToday = daily.reduce((sum, item) => sum + item.total_seconds, 0)

  // Process Heatmap and App breakdown
  const appTotalsMap = new Map<string, { seconds: number; count: number }>()
  const dayMap = new Map<string, { seconds: number; count: number; apps: Record<string, { seconds: number; count: number }> }>()

  heatmap.forEach(h => {
    const dateKey = h.date.split('T')[0]
    const app = h.app_name
    const secs = h.total_seconds
    const cnt = h.count || 1

    const prevApp = appTotalsMap.get(app) || { seconds: 0, count: 0 }
    appTotalsMap.set(app, { seconds: prevApp.seconds + secs, count: prevApp.count + cnt })

    let day = dayMap.get(dateKey)
    if (!day) {
      day = { seconds: 0, count: 0, apps: {} }
      dayMap.set(dateKey, day)
    }
    if (!day.apps[app]) day.apps[app] = { seconds: 0, count: 0 }
    day.apps[app].seconds += secs
    day.apps[app].count += cnt
  })

  const uniqueApps = Array.from(appTotalsMap.keys()).sort()

  // Calculate filtered stats based on activeRange
  const rangeAppMap = new Map<string, { seconds: number; count: number }>()
  let rangeTotal = 0

  dayMap.forEach((data, dateKey) => {
    if (dateKey >= activeRange.start && dateKey <= activeRange.end) {
      Object.entries(data.apps).forEach(([appName, appData]) => {
        if (selectedApp === 'All Apps' || selectedApp === appName) {
          const prev = rangeAppMap.get(appName) || { seconds: 0, count: 0 }
          rangeAppMap.set(appName, { seconds: prev.seconds + appData.seconds, count: prev.count + appData.count })
          rangeTotal += appData.seconds
        }
      })
    }
  })

  const rangeApps: AppStat[] = Array.from(rangeAppMap.entries())
    .map(([app_name, data]) => ({ app_name, total_seconds: data.seconds }))
    .sort((a, b) => b.total_seconds - a.total_seconds)

  const rangeTopApp = rangeApps.length > 0 ? rangeApps[0].app_name : 'None'
  const rangeMaxSeconds = rangeApps.length > 0 ? rangeApps[0].total_seconds : 1

  let maxDaily = 0
  let maxDailyDate = ''
  let totalTrackedTime = 0

  dayMap.forEach((data, dateKey) => {
    let daySecs = 0
    if (selectedApp === 'All Apps') {
      daySecs = Object.values(data.apps).reduce((acc, a) => acc + a.seconds, 0)
    } else if (data.apps[selectedApp]) {
      daySecs = data.apps[selectedApp].seconds
    }

    if (daySecs > maxDaily) {
      maxDaily = daySecs
      maxDailyDate = dateKey
    }
    totalTrackedTime += daySecs
  })

  let maxDateStr = 'None'
  if (maxDailyDate) {
    const [y, m, d] = maxDailyDate.split('-').map(Number)
    const dateObj = new Date(y, m - 1, d)
    maxDateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // GitHub 53-week Heatmap calculation in IST (Asia/Kolkata)
  const TOTAL_WEEKS = 53
  const totalDays = TOTAL_WEEKS * 7
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const todayY = now.getFullYear()
  const todayM = String(now.getMonth() + 1).padStart(2, '0')
  const todayD = String(now.getDate()).padStart(2, '0')
  const todayStr = `${todayY}-${todayM}-${todayD}`

  const todayDay = now.getDay() // 0 = Sun, 6 = Sat
  const endDate = new Date(now)
  endDate.setDate(now.getDate() + (6 - todayDay)) // End on current week's Saturday

  const startDate = new Date(endDate)
  startDate.setDate(endDate.getDate() - totalDays + 1) // Sunday 52 weeks ago

  const cells = []
  const monthLabels: { name: string; span: number }[] = []
  let currentMonth = -1
  let colsSinceLastMonth = 0

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)

    const y = d.getFullYear()
    const mStr = String(d.getMonth() + 1).padStart(2, '0')
    const dayStr = String(d.getDate()).padStart(2, '0')
    const dateStr = `${y}-${mStr}-${dayStr}`
    const isFuture = dateStr > todayStr

    // Check start of week (Sunday)
    if (i % 7 === 0) {
      const m = d.getMonth()
      if (m !== currentMonth) {
        if (currentMonth !== -1) {
          monthLabels.push({
            name: new Date(2000, currentMonth, 1).toLocaleString('en-US', { month: 'short' }),
            span: colsSinceLastMonth
          })
        }
        currentMonth = m
        colsSinceLastMonth = 1
      } else {
        colsSinceLastMonth++
      }
    }

    const dayData = dayMap.get(dateStr)
    let seconds = 0
    let count = 0
    const topApps: { name: string; seconds: number; count: number }[] = []

    if (dayData) {
      if (selectedApp === 'All Apps') {
        Object.entries(dayData.apps).forEach(([appName, val]) => {
          seconds += val.seconds
          count += val.count
          topApps.push({ name: appName, ...val })
        })
        topApps.sort((a, b) => b.seconds - a.seconds)
      } else if (dayData.apps[selectedApp]) {
        seconds = dayData.apps[selectedApp].seconds
        count = dayData.apps[selectedApp].count
      }
    }

    let level = 0
    if (metricMode === 'time') {
      if (seconds >= 28800) level = 4      // 8+ hours
      else if (seconds >= 14400) level = 3 // 4-8 hours
      else if (seconds >= 7200) level = 2  // 2-4 hours
      else if (seconds > 0) level = 1      // >0 hours
    } else {
      if (count >= 12) level = 4          // 12+ sessions
      else if (count >= 6) level = 3      // 6-11 sessions
      else if (count >= 3) level = 2      // 3-5 sessions
      else if (count > 0) level = 1       // 1-2 sessions
    }

    const formattedDate = d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })

    cells.push({
      date: dateStr,
      formattedDate,
      seconds,
      count,
      level,
      isFuture,
      topApps: topApps.slice(0, 3),
      totalAppsCount: topApps.length
    })
  }

  if (colsSinceLastMonth > 0) {
    monthLabels.push({
      name: new Date(2000, currentMonth, 1).toLocaleString('en-US', { month: 'short' }),
      span: colsSinceLastMonth
    })
  }

  if (loading) return <div className="spinner" />
  if (error) return <div className="alert alert-error">{error}</div>

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Overview</h1>
          <p>Here's what you've been up to</p>
        </div>

        {/* Global Date Range Filter Dropdown */}
        <div className="date-filter-wrapper" ref={dateFilterRef}>
          <button
            className="date-filter-btn"
            onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
          >
            <Calendar size={15} color="var(--color-accent)" />
            <span>{selectedPreset.label}</span>
            <ChevronDown size={14} style={{ transform: isDateFilterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {isDateFilterOpen && (
            <div className="date-filter-dropdown">
              <div className="date-filter-presets">
                {PRESETS.map(preset => (
                  <div
                    key={preset.id}
                    className={`date-filter-item ${selectedPreset.id === preset.id ? 'active' : ''}`}
                    onClick={() => handleSelectPreset(preset)}
                  >
                    <span>{preset.label}</span>
                    <span className="preset-badge">{preset.shortcut}</span>
                  </div>
                ))}
              </div>

              <div className="date-filter-divider" />

              <div className="date-filter-custom">
                <div className="custom-date-group">
                  <label>Start:</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={e => setCustomStart(e.target.value)}
                    onClick={e => (e.target as HTMLInputElement).showPicker?.()}
                    className="custom-date-input"
                  />
                </div>
                <div className="custom-date-group">
                  <label>End:</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={e => setCustomEnd(e.target.value)}
                    onClick={e => (e.target as HTMLInputElement).showPicker?.()}
                    className="custom-date-input"
                  />
                </div>
                <button className="btn-apply-filter" onClick={handleApplyCustom}>
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bento-grid">
        {/* Top 4 Metric Cards */}
        <div className="bento-card bento-today">
          <div className="card-title portfolio-card-title">Today</div>
          <div className="stat-value">{formatTime(totalToday)}</div>
        </div>

        <div className="bento-card bento-week">
          <div className="card-title portfolio-card-title">{selectedPreset.label}</div>
          <div className="stat-value">{formatTime(rangeTotal)}</div>
        </div>

        <div className="bento-card bento-topapp">
          <div className="card-title portfolio-card-title">Top App</div>
          <div className="stat-value" style={{ fontSize: 20, color: 'var(--color-accent)' }}>{rangeTopApp}</div>
        </div>

        <div className="bento-card bento-tracked">
          <div className="card-title portfolio-card-title">Apps Tracked</div>
          <div className="stat-value">{rangeApps.length}</div>
        </div>

        {/* Middle Two Large Cards */}
        <div className="bento-card bento-usage">
          <div className="card-title portfolio-card-title">Softwares & Usage</div>
          {rangeApps.length === 0
            ? <div className="empty-state" style={{ margin: 'auto' }}><h3>No activity in this range</h3></div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', margin: 'auto 0' }}>
                {rangeApps.slice(0, 8).map(app => (
                  <div className="app-bar-row" key={app.app_name}>
                    <div className="app-bar-dot" />
                    <span className="app-bar-label">{app.app_name}</span>
                    <div className="app-bar-track">
                      <div
                        className="app-bar-fill"
                        style={{ width: `${Math.round((app.total_seconds / rangeMaxSeconds) * 100)}%` }}
                      />
                    </div>
                    <span className="app-bar-time">{formatTime(app.total_seconds)}</span>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        <div className="bento-card bento-weekly">
          <div className="card-title portfolio-card-title">Softwares & Tools</div>
          {rangeApps.length === 0
            ? <div className="empty-state" style={{ margin: 'auto' }}><h3>No data in this range</h3></div>
            : (
              <ResponsiveContainer width="100%" height={220} style={{ margin: 'auto' }}>
                <BarChart data={rangeApps.slice(0, 10)} margin={{ top: 0, right: 0, bottom: 24, left: 0 }}>
                  <XAxis dataKey="app_name" tick={{ fontSize: 11, fill: '#8b949e' }} angle={-30} textAnchor="end" />
                  <YAxis tickFormatter={v => formatTime(v as number)} tick={{ fontSize: 11, fill: '#8b949e' }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    formatter={(v) => [formatTime(v as number), 'Time']}
                    contentStyle={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                    labelStyle={{ color: 'var(--color-text)', fontWeight: 600 }}
                    itemStyle={{ color: 'var(--color-text)' }}
                  />
                  <Bar dataKey="total_seconds" radius={[4,4,0,0]}>
                    {rangeApps.slice(0, 10).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Activity Heatmap */}
        <div className="bento-card bento-heatmap">
          <div className="heatmap-header-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, width: '100%' }}>
            <div className="card-title portfolio-card-title" style={{ marginBottom: 0 }}>Consistency Heatmap</div>
            
            <div className="heatmap-header-controls">
              {/* Mode Toggle: Time Spent vs Frequency */}
              <div className="heatmap-segmented">
                <button
                  className={`heatmap-seg-btn ${metricMode === 'time' ? 'active' : ''}`}
                  onClick={() => setMetricMode('time')}
                >
                  <Clock size={12} />
                  <span>Time</span>
                </button>
                <button
                  className={`heatmap-seg-btn ${metricMode === 'frequency' ? 'active' : ''}`}
                  onClick={() => setMetricMode('frequency')}
                >
                  <Activity size={12} />
                  <span>Frequency</span>
                </button>
              </div>

              {/* Custom App Selector Dropdown */}
              <div className="app-selector-wrapper" ref={appMenuRef}>
                <button
                  className="app-selector-btn"
                  onClick={() => setIsAppMenuOpen(!isAppMenuOpen)}
                >
                  <Layers size={13} color="var(--color-accent)" />
                  <span>{selectedApp}</span>
                  <ChevronDown size={13} style={{ transform: isAppMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {isAppMenuOpen && (
                  <div className="app-selector-menu">
                    <div
                      className={`app-selector-item ${selectedApp === 'All Apps' ? 'selected' : ''}`}
                      onClick={() => { setSelectedApp('All Apps'); setIsAppMenuOpen(false) }}
                    >
                      <span className="app-name">All Apps</span>
                      <span className="app-time">{formatTime(totalTrackedTime)}</span>
                    </div>
                    {uniqueApps.map(app => {
                      const data = appTotalsMap.get(app)
                      return (
                        <div
                          key={app}
                          className={`app-selector-item ${selectedApp === app ? 'selected' : ''}`}
                          onClick={() => { setSelectedApp(app); setIsAppMenuOpen(false) }}
                        >
                          <span className="app-name">{app}</span>
                          <span className="app-time">{data ? formatTime(data.seconds) : '0s'}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="heatmap-container">
            <div className="heatmap-wrapper">
              <div />
              <div className="heatmap-months">
                {monthLabels.map((lbl, idx) => (
                  <div key={idx} style={{ gridColumn: `span ${lbl.span}`, textAlign: 'left' }}>
                    {lbl.name}
                  </div>
                ))}
              </div>
              
              <div className="heatmap-labels-y">
                <div style={{ gridRow: '2' }}>Mon</div>
                <div style={{ gridRow: '4' }}>Wed</div>
                <div style={{ gridRow: '6' }}>Fri</div>
              </div>
              
              <div className="heatmap-grid">
                {cells.map((cell, idx) => (
                  cell.isFuture ? (
                    <div
                      key={idx}
                      className="heatmap-cell future"
                      style={{ opacity: 0, pointerEvents: 'none' }}
                    />
                  ) : (
                    <div 
                      key={idx} 
                      className={`heatmap-cell level-${cell.level}`}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setHoveredCell({
                          date: cell.date,
                          formattedDate: cell.formattedDate,
                          seconds: cell.seconds,
                          count: cell.count,
                          topApps: cell.topApps,
                          totalAppsCount: cell.totalAppsCount,
                          x: rect.left + rect.width / 2,
                          y: rect.top - 10
                        })
                      }}
                      onMouseLeave={() => setHoveredCell(null)}
                    />
                  )
                ))}
              </div>
            </div>
            
            <div className="heatmap-footer">
              <div className="heatmap-legend">
                <span>Less</span>
                <div className="legend-box level-0"></div>
                <div className="legend-box level-1"></div>
                <div className="legend-box level-2"></div>
                <div className="legend-box level-3"></div>
                <div className="legend-box level-4"></div>
                <span>More</span>
              </div>
            </div>
          </div>
        </div>

        {/* All Time Total Card */}
        <div className="bento-card bento-alltime">
          <div className="card-title portfolio-card-title">All Time Total</div>
          <div className="stat-value">{formatTime(totalTrackedTime)}</div>
        </div>

        {/* Most Active Day Card */}
        <div className="bento-card bento-active">
          <div className="card-title portfolio-card-title">Most Active Day</div>
          <div className="stat-value" style={{ color: 'var(--color-warning)', fontSize: 28 }}>{maxDateStr}</div>
          <div className="stat-subtitle">{formatTime(maxDaily)}</div>
        </div>
      </div>

      {/* Rich Interactive Floating Tooltip */}
      {hoveredCell && (
        <div
          className="heatmap-floating-tooltip"
          style={{
            left: hoveredCell.x,
            top: hoveredCell.y
          }}
        >
          <div className="tooltip-date">{hoveredCell.formattedDate}</div>
          <div className="tooltip-metric">
            {metricMode === 'time' ? (
              hoveredCell.seconds > 0 ? (
                <>
                  <span className="tooltip-value">{formatTime(hoveredCell.seconds)}</span>
                  <span className="tooltip-sub">({hoveredCell.count} session{hoveredCell.count === 1 ? '' : 's'})</span>
                </>
              ) : (
                <span className="tooltip-empty">No time tracked</span>
              )
            ) : (
              hoveredCell.count > 0 ? (
                <>
                  <span className="tooltip-value">{hoveredCell.count} session{hoveredCell.count === 1 ? '' : 's'}</span>
                  <span className="tooltip-sub">({formatTime(hoveredCell.seconds)})</span>
                </>
              ) : (
                <span className="tooltip-empty">No sessions recorded</span>
              )
            )}
          </div>
          {hoveredCell.topApps && hoveredCell.topApps.length > 0 && selectedApp === 'All Apps' && (
            <div className="tooltip-apps">
              {hoveredCell.topApps.map((a, i) => (
                <div key={i} className="tooltip-app-row">
                  <span>{a.name}</span>
                  <span>{metricMode === 'time' ? formatTime(a.seconds) : `${a.count} sess`}</span>
                </div>
              ))}
              {hoveredCell.totalAppsCount > 3 && (
                <div className="tooltip-more-apps">
                  &amp; {hoveredCell.totalAppsCount - 3} more...
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
