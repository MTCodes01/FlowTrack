import { formatTime } from '../../../utils/format'
import type { RangeApp, Metric } from '../../../types/dashboard'

interface Props {
  apps: RangeApp[]
  maxSeconds: number
  metricMode: Metric
}

export default function SoftwareUsage({ apps, maxSeconds, metricMode }: Props) {
  const sorted = metricMode === 'time'
    ? [...apps].sort((a, b) => b.total_seconds - a.total_seconds)
    : [...apps].sort((a, b) => b.count - a.count)

  return (
    <div className="bento-card col-span-2">
      <div className="card-title">Software & Usage</div>
      {sorted.length === 0
        ? <div className="empty-state" style={{ margin: 'auto' }}><h3>No activity in this range</h3></div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sorted.slice(0, 6).map(app => {
              const barPct = Math.round((app.total_seconds / Math.max(1, maxSeconds)) * 100)
              return (
                <div key={app.app_name} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }}>
                      {app.app_name}
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--color-muted)' }}>
                      {formatTime(app.total_seconds)} · {app.count} sess
                    </span>
                  </div>
                  <div className="app-bar-track">
                    <div className="app-bar-fill" style={{ width: `${barPct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}
