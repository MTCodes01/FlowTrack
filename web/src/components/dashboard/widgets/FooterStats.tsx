import { formatTime } from '../../../utils/format'
import type { RangeSummary, DateRange } from '../../../types/dashboard'

interface Props {
  effectiveTotalSeconds: number
  maxDateStr: string
  maxDaily: number
  effectiveLongestApp: string
  effectiveLongestSession: number
  activeRange: DateRange
  summary: RangeSummary | null
}

export default function FooterStats({
  effectiveTotalSeconds, maxDateStr, maxDaily,
  effectiveLongestApp, effectiveLongestSession, activeRange
}: Props) {
  // Rough average based on range duration
  const ms = new Date(activeRange.end).getTime() - new Date(activeRange.start).getTime()
  const days = Math.max(1, ms / 86400000 + 1)
  const avgDaily = Math.floor(effectiveTotalSeconds / days)

  return (
    <div className="bento-card col-span-4" style={{ flexDirection: 'row', justifyContent: 'space-between', padding: '16px 20px', alignItems: 'center' }}>
      <div>
        <div className="card-title" style={{ marginBottom: 4 }}>Avg Daily Usage</div>
        <div style={{ fontFamily: 'Montserrat', fontSize: 16, fontWeight: 700 }}>
          {formatTime(avgDaily)}
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div className="card-title" style={{ marginBottom: 4 }}>Most Active Day</div>
        <div style={{ fontFamily: 'Montserrat', fontSize: 16, fontWeight: 700, color: 'var(--color-warning)' }}>
          {maxDateStr}
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
          {formatTime(maxDaily)}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="card-title" style={{ marginBottom: 4 }}>Longest Session</div>
        <div style={{ fontFamily: 'Montserrat', fontSize: 16, fontWeight: 700 }}>
          {effectiveLongestApp}
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
          {effectiveLongestSession ? formatTime(effectiveLongestSession) : '—'}
        </div>
      </div>
    </div>
  )
}
