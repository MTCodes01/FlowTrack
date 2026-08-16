import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Calendar } from 'lucide-react'

// Hooks & Types
import { useDashboardData } from '../hooks/useDashboardData'
import { getMe, updatePreferences } from '../api/client'
import { loadWidgetConfig, saveWidgetConfig, type DateRange, type WidgetConfig, type Metric } from '../types/dashboard'
import { formatYYYYMMDD, nowIST } from '../utils/format'

// Widgets
import SummaryCards from '../components/dashboard/widgets/SummaryCards'
import ActivityTrend from '../components/dashboard/widgets/ActivityTrend'
import SoftwareUsage from '../components/dashboard/widgets/SoftwareUsage'
import CurrentActivity from '../components/dashboard/widgets/CurrentActivity'
import CategoryBreakdown from '../components/dashboard/widgets/CategoryBreakdown'
import ActiveHours from '../components/dashboard/widgets/ActiveHours'
import HeatmapWidget from '../components/dashboard/widgets/HeatmapWidget'
import RecentActivity from '../components/dashboard/widgets/RecentActivity'
import Insights from '../components/dashboard/widgets/Insights'
import FooterStats from '../components/dashboard/widgets/FooterStats'
import WidgetCustomizer from '../components/dashboard/WidgetCustomizer'

interface Props { token: string }

interface DateFilterPreset {
  id: string; label: string; shortcut: string; getRange: (now: Date) => DateRange
}

const PRESETS: DateFilterPreset[] = [
  { id: 'today', label: 'Today', shortcut: 'D', getRange: (now) => { const d = formatYYYYMMDD(now); return { start: d, end: d } } },
  { id: 'yesterday', label: 'Yesterday', shortcut: 'E', getRange: (now) => { const y = new Date(now); y.setDate(now.getDate() - 1); const d = formatYYYYMMDD(y); return { start: d, end: d } } },
  { id: 'this_week', label: 'This Week', shortcut: 'W', getRange: (now) => { const day = now.getDay(); const diff = day === 0 ? 6 : day - 1; const start = new Date(now); start.setDate(now.getDate() - diff); return { start: formatYYYYMMDD(start), end: formatYYYYMMDD(now) } } },
  { id: 'this_month', label: 'This Month', shortcut: 'M', getRange: (now) => { const start = new Date(now.getFullYear(), now.getMonth(), 1); return { start: formatYYYYMMDD(start), end: formatYYYYMMDD(now) } } },
  { id: 'this_year', label: 'This Year', shortcut: 'Y', getRange: (now) => { const start = new Date(now.getFullYear(), 0, 1); return { start: formatYYYYMMDD(start), end: formatYYYYMMDD(now) } } },
  { id: 'past_7_days', label: 'Past 7 Days', shortcut: '1', getRange: (now) => { const start = new Date(now); start.setDate(now.getDate() - 6); return { start: formatYYYYMMDD(start), end: formatYYYYMMDD(now) } } },
  { id: 'past_30_days', label: 'Past 30 Days', shortcut: '2', getRange: (now) => { const start = new Date(now); start.setDate(now.getDate() - 29); return { start: formatYYYYMMDD(start), end: formatYYYYMMDD(now) } } },
  { id: 'past_6_months', label: 'Past 6 Months', shortcut: '3', getRange: (now) => { const start = new Date(now); start.setMonth(now.getMonth() - 6); return { start: formatYYYYMMDD(start), end: formatYYYYMMDD(now) } } },
  { id: 'past_12_months', label: 'Past 12 Months', shortcut: '4', getRange: (now) => { const start = new Date(now); start.setFullYear(now.getFullYear() - 1); return { start: formatYYYYMMDD(start), end: formatYYYYMMDD(now) } } },
  { id: 'all_time', label: 'All Time', shortcut: 'A', getRange: () => ({ start: '1970-01-01', end: '2099-12-31' }) }
]

export default function Dashboard({ token }: Props) {
  // App state
  const [selectedApp, setSelectedApp] = useState<string>('All Apps')
  const [metricMode, setMetricMode] = useState<Metric>('time')
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig[]>(() => loadWidgetConfig())
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false)

  // Load preferences from backend
  useEffect(() => {
    getMe(token).then(user => {
      if (user.preferences) {
        try {
          const config = JSON.parse(user.preferences)
          if (Array.isArray(config)) {
            setWidgetConfig(config)
            saveWidgetConfig(config)
          }
        } catch (e) {
          console.error('Failed to parse preferences', e)
        }
      }
    }).catch(console.error)
  }, [token])

  // Date filter state
  const [selectedPreset, setSelectedPreset] = useState<DateFilterPreset>(PRESETS[3])
  const [activeRange, setActiveRange] = useState<DateRange>(() => PRESETS[3].getRange(nowIST()))
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const dateFilterRef = useRef<HTMLDivElement>(null)

  // Data fetching
  const data = useDashboardData(token, activeRange, selectedApp)

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dateFilterRef.current && !dateFilterRef.current.contains(e.target as Node)) setIsDateFilterOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return
      const key = e.key.toUpperCase()
      const match = PRESETS.find(p => p.shortcut === key)
      if (match) {
        setSelectedPreset(match)
        setActiveRange(match.getRange(nowIST()))
        setIsDateFilterOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSelectPreset = (preset: DateFilterPreset) => {
    setSelectedPreset(preset)
    setActiveRange(preset.getRange(nowIST()))
    setIsDateFilterOpen(false)
  }

  const handleApplyCustom = () => {
    if (!customStart || !customEnd) return
    setSelectedPreset({ id: 'custom', label: 'Custom Range', shortcut: '', getRange: () => ({ start: customStart, end: customEnd }) })
    setActiveRange({ start: customStart, end: customEnd })
    setIsDateFilterOpen(false)
  }

  const handleConfigChange = (newConfig: WidgetConfig[]) => {
    setWidgetConfig(newConfig)
    saveWidgetConfig(newConfig)
    updatePreferences(JSON.stringify(newConfig), token).catch(console.error)
  }

  const isVisible = (id: string) => widgetConfig.find(w => w.id === id)?.visible !== false

  if (data.loading) return <div className="spinner" />
  if (data.error) return <div className="alert alert-error">{data.error}</div>

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Overview</h1>
          <p>Here's what you've been up to</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="date-filter-wrapper" ref={dateFilterRef}>
            <button className="date-filter-btn" onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}>
              <Calendar size={15} color="var(--color-accent)" />
              <span>{selectedPreset.label}</span>
              <ChevronDown size={14} style={{ transform: isDateFilterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {isDateFilterOpen && (
              <div className="date-filter-dropdown">
                <div className="date-filter-presets">
                  {PRESETS.map(preset => (
                    <div key={preset.id} className={`date-filter-item ${selectedPreset.id === preset.id ? 'active' : ''}`} onClick={() => handleSelectPreset(preset)}>
                      <span>{preset.label}</span>
                      <span className="preset-badge">{preset.shortcut}</span>
                    </div>
                  ))}
                </div>
                <div className="date-filter-divider" />
                <div className="date-filter-custom">
                  <div className="custom-date-group">
                    <label>Start:</label>
                    <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} onClick={e => (e.target as HTMLInputElement).showPicker?.()} className="custom-date-input" />
                  </div>
                  <div className="custom-date-group">
                    <label>End:</label>
                    <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} onClick={e => (e.target as HTMLInputElement).showPicker?.()} className="custom-date-input" />
                  </div>
                  <button className="btn-apply-filter" onClick={handleApplyCustom}>Apply</button>
                </div>
              </div>
            )}
          </div>

          <WidgetCustomizer
            isOpen={isCustomizerOpen}
            setIsOpen={setIsCustomizerOpen}
            config={widgetConfig}
            onConfigChange={handleConfigChange}
          />
        </div>
      </div>

      <div className="dashboard-grid">
        {isVisible('summary') && <SummaryCards {...data} />}
        
        {isVisible('trend') && <ActivityTrend trend={data.effectiveTrend} granularity={data.trendGranularity} metricMode={metricMode} />}
        
        {isVisible('software') && <SoftwareUsage apps={data.rangeApps} maxSeconds={data.rangeMaxSeconds} metricMode={metricMode} />}
        
        {isVisible('current_activity') && <CurrentActivity currentActivity={data.currentActivity} />}
        
        {isVisible('categories') && <CategoryBreakdown stats={data.categoryStats} />}
        
        {isVisible('hours') && <ActiveHours trend={data.effectiveTrend} granularity={data.trendGranularity} />}
        
        {isVisible('heatmap') && (
          <HeatmapWidget 
            dayMap={data.dayMap}
            appTotalsMap={data.appTotalsMap}
            uniqueApps={data.uniqueApps}
            totalTrackedTime={data.totalTrackedTime}
            selectedApp={selectedApp}
            onSelectApp={setSelectedApp}
            metricMode={metricMode}
            onMetricChange={setMetricMode}
          />
        )}
        
        {isVisible('recent') && <RecentActivity sessions={data.recentSessions} />}
        
        {isVisible('insights') && <Insights {...data} />}
        
        {isVisible('footer') && <FooterStats {...data} activeRange={activeRange} />}
      </div>
    </>
  )
}
