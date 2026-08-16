import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { formatTime, pctChange } from '../../../utils/format'
import type { RangeSummary } from '../../../types/dashboard'

interface Props {
  effectiveTotalSeconds: number
  effectiveSessions: number
  effectiveAvgSession: number
  effectiveTopApp: string
  effectiveTopAppSeconds: number
  summary: RangeSummary | null
}

function Comparison({ curr, prev }: { curr: number; prev: number }) {
  const pct = pctChange(curr, prev)
  if (pct === null) return null
  if (pct > 0) return (
    <div className="stat-comparison up">
      <ArrowUpRight size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
      {pct}% vs prev period
    </div>
  )
  if (pct < 0) return (
    <div className="stat-comparison down">
      <ArrowDownRight size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
      {Math.abs(pct)}% vs prev period
    </div>
  )
  return (
    <div className="stat-comparison neutral">
      <Minus size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
      No change
    </div>
  )
}

export default function SummaryCards({ effectiveTotalSeconds, effectiveSessions, effectiveAvgSession, effectiveTopApp, effectiveTopAppSeconds, summary }: Props) {
  return (
    <>
      <div className="bento-card col-span-1">
        <div className="card-title">Total Usage</div>
        <div className="stat-value">{formatTime(effectiveTotalSeconds)}</div>
        {summary && <Comparison curr={summary.total_seconds} prev={summary.prev_total_seconds} />}
      </div>

      <div className="bento-card col-span-1">
        <div className="card-title">Sessions</div>
        <div className="stat-value">{effectiveSessions}</div>
        {summary && <Comparison curr={summary.total_sessions} prev={summary.prev_sessions} />}
      </div>

      <div className="bento-card col-span-1">
        <div className="card-title">Top App</div>
        <div className="stat-value" style={{ color: 'var(--color-accent)', fontSize: 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {effectiveTopApp}
        </div>
        <div className="stat-comparison neutral">
          <Minus size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
          {formatTime(effectiveTopAppSeconds)}
        </div>
      </div>

      <div className="bento-card col-span-1">
        <div className="card-title">Avg Session</div>
        <div className="stat-value">{formatTime(effectiveAvgSession)}</div>
        {summary && <Comparison curr={summary.avg_session} prev={summary.prev_avg_session} />}
      </div>
    </>
  )
}
