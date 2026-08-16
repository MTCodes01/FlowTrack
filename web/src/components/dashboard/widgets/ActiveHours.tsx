import { formatTime } from '../../../utils/format'
import type { TrendPoint, Granularity } from '../../../types/dashboard'

interface Props {
  trend: TrendPoint[]
  granularity: Granularity
}

export default function ActiveHours({ trend, granularity }: Props) {
  const activeBars = trend.filter(h => h.total_seconds > 0)
  const maxSecs = activeBars.reduce((m, h) => Math.max(m, h.total_seconds), 1)

  return (
    <div className="bento-card col-span-2">
      <div className="card-title">Most Active Hours</div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
        {granularity !== 'hourly'
          ? (
            <p className="current-meta" style={{ margin: 'auto 0', textAlign: 'center' }}>
              Select <strong style={{ color: 'var(--color-text)' }}>Today</strong> or{' '}
              <strong style={{ color: 'var(--color-text)' }}>Yesterday</strong> for hourly breakdown
            </p>
          )
          : activeBars.length === 0
            ? <div className="empty-state" style={{ margin: 'auto' }}><h3>No activity today</h3></div>
            : activeBars.map(h => (
              <div key={h.label} className="hourly-row">
                <span className="hourly-label">{h.label}</span>
                <div className="hourly-bar-container">
                  <div className="hourly-segment" style={{ width: `${Math.min(100, Math.max(2, (h.total_seconds / maxSecs) * 100))}%` }} />
                </div>
                <span style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'JetBrains Mono, monospace', minWidth: 40, textAlign: 'right' }}>
                  {formatTime(h.total_seconds)}
                </span>
              </div>
            ))
        }
      </div>
    </div>
  )
}
