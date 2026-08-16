import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Clock, Activity, Layers, ChevronDown } from 'lucide-react'
import { formatTime, formatYYYYMMDD, nowIST } from '../../../utils/format'
import type { DayData, Metric } from '../../../types/dashboard'

interface HoveredCell {
  formattedDate: string
  seconds: number
  count: number
  topApps: { name: string; seconds: number; count: number }[]
  totalAppsCount: number
  rect: DOMRect
}

interface Props {
  dayMap: Map<string, DayData>
  appTotalsMap: Map<string, { seconds: number; count: number }>
  uniqueApps: string[]
  totalTrackedTime: number
  selectedApp: string
  onSelectApp: (app: string) => void
  metricMode: Metric
  onMetricChange: (mode: Metric) => void
}

function computeHeatmapCells(dayMap: Map<string, DayData>, selectedApp: string, metricMode: Metric) {
  const TOTAL_WEEKS = 53
  const totalDays = TOTAL_WEEKS * 7
  const now = nowIST()
  const todayStr = formatYYYYMMDD(now)
  const todayDay = now.getDay()
  const endDate = new Date(now)
  endDate.setDate(now.getDate() + (6 - todayDay))
  const startDate = new Date(endDate)
  startDate.setDate(endDate.getDate() - totalDays + 1)

  const cells = []
  const monthLabels: { name: string; span: number }[] = []
  let currentMonth = -1, colsSinceLastMonth = 0

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    const y = d.getFullYear()
    const mStr = String(d.getMonth() + 1).padStart(2, '0')
    const dayStr = String(d.getDate()).padStart(2, '0')
    const dateStr = `${y}-${mStr}-${dayStr}`
    const isFuture = dateStr > todayStr

    if (i % 7 === 0) {
      const m = d.getMonth()
      if (m !== currentMonth) {
        if (currentMonth !== -1) monthLabels.push({ name: new Date(2000, currentMonth, 1).toLocaleString('en-US', { month: 'short' }), span: colsSinceLastMonth })
        currentMonth = m; colsSinceLastMonth = 1
      } else { colsSinceLastMonth++ }
    }

    const dayData = dayMap.get(dateStr)
    let seconds = 0, count = 0
    const topApps: { name: string; seconds: number; count: number }[] = []

    if (dayData) {
      if (selectedApp === 'All Apps') {
        Object.entries(dayData.apps).forEach(([appName, val]) => {
          seconds += val.seconds; count += val.count
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
      if (seconds >= 28800) level = 4
      else if (seconds >= 14400) level = 3
      else if (seconds >= 7200) level = 2
      else if (seconds > 0) level = 1
    } else {
      if (count >= 12) level = 4
      else if (count >= 6) level = 3
      else if (count >= 3) level = 2
      else if (count > 0) level = 1
    }

    cells.push({
      date: dateStr,
      formattedDate: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      seconds, count, level, isFuture,
      topApps: topApps.slice(0, 6),
      totalAppsCount: topApps.length
    })
  }

  if (colsSinceLastMonth > 0) {
    monthLabels.push({ name: new Date(2000, currentMonth, 1).toLocaleString('en-US', { month: 'short' }), span: colsSinceLastMonth })
  }

  return { cells, monthLabels }
}

function computeTooltipStyle(rect: DOMRect): React.CSSProperties {
  const TW = 220, GAP = 8, MARGIN = 12
  let left = rect.left + rect.width / 2
  let top = rect.top - GAP

  if (left - TW / 2 < MARGIN) {
    left = MARGIN + TW / 2
  }
  if (left + TW / 2 > window.innerWidth - MARGIN) {
    left = window.innerWidth - MARGIN - TW / 2
  }

  let transform = 'translate(-50%, -100%)'
  // rough estimate of max tooltip height
  if (top - 230 < MARGIN) {
    top = rect.bottom + GAP
    transform = 'translate(-50%, 0)'
  }

  return { position: 'fixed', left, top, width: TW, transform }
}

export default function HeatmapWidget({ dayMap, appTotalsMap, uniqueApps, totalTrackedTime, selectedApp, onSelectApp, metricMode, onMetricChange }: Props) {
  const [hoveredCell, setHoveredCell] = useState<HoveredCell | null>(null)
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false)
  const appMenuRef = useRef<HTMLDivElement>(null)

  const { cells, monthLabels } = computeHeatmapCells(dayMap, selectedApp, metricMode)

  return (
    <div className="bento-card col-span-4" style={{ paddingBottom: 24 }}>
      <div className="heatmap-header-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, width: '100%' }}>
        <div className="card-title" style={{ marginBottom: 0 }}>Consistency Heatmap</div>
        <div className="heatmap-header-controls">
          <div className="heatmap-segmented">
            <button className={`heatmap-seg-btn ${metricMode === 'time' ? 'active' : ''}`} onClick={() => onMetricChange('time')}>
              <Clock size={12} /><span>Time</span>
            </button>
            <button className={`heatmap-seg-btn ${metricMode === 'frequency' ? 'active' : ''}`} onClick={() => onMetricChange('frequency')}>
              <Activity size={12} /><span>Frequency</span>
            </button>
          </div>
          <div className="app-selector-wrapper" ref={appMenuRef}>
            <button className="app-selector-btn" onClick={() => setIsAppMenuOpen(!isAppMenuOpen)}>
              <Layers size={13} color="var(--color-accent)" />
              <span>{selectedApp}</span>
              <ChevronDown size={13} style={{ transform: isAppMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {isAppMenuOpen && (
              <div className="app-selector-menu">
                <div className={`app-selector-item ${selectedApp === 'All Apps' ? 'selected' : ''}`} onClick={() => { onSelectApp('All Apps'); setIsAppMenuOpen(false) }}>
                  <span className="app-name">All Apps</span>
                  <span className="app-time">{formatTime(totalTrackedTime)}</span>
                </div>
                {uniqueApps.map(app => {
                  const data = appTotalsMap.get(app)
                  return (
                    <div key={app} className={`app-selector-item ${selectedApp === app ? 'selected' : ''}`} onClick={() => { onSelectApp(app); setIsAppMenuOpen(false) }}>
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
            {monthLabels.map((lbl, idx) => <div key={idx} style={{ gridColumn: `span ${lbl.span}`, textAlign: 'left' }}>{lbl.name}</div>)}
          </div>
          <div className="heatmap-labels-y">
            <div style={{ gridRow: '2' }}>Mon</div>
            <div style={{ gridRow: '4' }}>Wed</div>
            <div style={{ gridRow: '6' }}>Fri</div>
          </div>
          <div className="heatmap-grid">
            {cells.map((cell, idx) =>
              cell.isFuture
                ? <div key={idx} className="heatmap-cell future" style={{ opacity: 0, pointerEvents: 'none' }} />
                : (
                  <div
                    key={idx}
                    className={`heatmap-cell level-${cell.level}`}
                    onMouseEnter={e => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setHoveredCell({ formattedDate: cell.formattedDate, seconds: cell.seconds, count: cell.count, topApps: cell.topApps, totalAppsCount: cell.totalAppsCount, rect })
                    }}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                )
            )}
          </div>
        </div>
        <div className="heatmap-footer">
          <div className="heatmap-legend">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map(l => <div key={l} className={`legend-box level-${l}`} />)}
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Viewport-aware Tooltip */}
      {hoveredCell && createPortal(
        <div className="heatmap-floating-tooltip" style={computeTooltipStyle(hoveredCell.rect)}>
          <div className="tooltip-date">{hoveredCell.formattedDate}</div>
          <div className="tooltip-metric">
            {metricMode === 'time'
              ? hoveredCell.seconds > 0
                ? <><span className="tooltip-value">{formatTime(hoveredCell.seconds)}</span><span className="tooltip-sub">{hoveredCell.count} session{hoveredCell.count === 1 ? '' : 's'}</span></>
                : <span className="tooltip-empty">No activity</span>
              : hoveredCell.count > 0
                ? <><span className="tooltip-value">{hoveredCell.count} session{hoveredCell.count === 1 ? '' : 's'}</span><span className="tooltip-sub">{formatTime(hoveredCell.seconds)} total</span></>
                : <span className="tooltip-empty">No activity</span>
            }
          </div>
          {hoveredCell.topApps.length > 0 && selectedApp === 'All Apps' && hoveredCell.seconds > 0 && (
            <div className="tooltip-apps">
              {hoveredCell.topApps.map((a, i) => (
                <div key={i} className="tooltip-app-row">
                  <span>{a.name}</span>
                  <span>{metricMode === 'time' ? formatTime(a.seconds) : `${a.count} sess`}</span>
                </div>
              ))}
              {hoveredCell.totalAppsCount > 6 && <div className="tooltip-more-apps">+ {hoveredCell.totalAppsCount - 6} more</div>}
            </div>
          )}
          {selectedApp !== 'All Apps' && hoveredCell.seconds > 0 && hoveredCell.count > 0 && (
            <div className="tooltip-apps">
              <div className="tooltip-app-row">
                <span style={{ color: 'var(--color-muted)' }}>Avg session</span>
                <span>{formatTime(Math.floor(hoveredCell.seconds / hoveredCell.count))}</span>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
