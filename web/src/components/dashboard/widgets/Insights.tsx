import { formatTime } from '../../../utils/format'
import type { RangeSummary, AppTransition } from '../../../types/dashboard'

interface Props {
  effectiveTopApp: string
  effectiveTopAppSeconds: number
  effectiveAvgSession: number
  effectiveLongestApp: string
  effectiveLongestSession: number
  transitions: AppTransition[]
  summary: RangeSummary | null
}

export default function Insights({
  effectiveTopApp, effectiveTopAppSeconds, effectiveAvgSession,
  effectiveLongestApp, effectiveLongestSession, transitions
}: Props) {
  return (
    <div className="bento-card col-span-2">
      <div className="card-title">Insights</div>
      <div>
        {effectiveTopApp !== 'None' && (
          <div className="insight-row">
            <strong style={{ color: 'var(--color-text)' }}>{effectiveTopApp}</strong> was your most-used app this period at {formatTime(effectiveTopAppSeconds)}.
          </div>
        )}
        {effectiveAvgSession > 0 && (
          <div className="insight-row">
            Your average session time was <strong style={{ color: 'var(--color-text)' }}>{formatTime(effectiveAvgSession)}</strong>.
          </div>
        )}
        {effectiveLongestApp && effectiveLongestApp !== '—' && (
          <div className="insight-row">
            Longest session was <strong style={{ color: 'var(--color-text)' }}>{formatTime(effectiveLongestSession)}</strong> in <strong style={{ color: 'var(--color-text)' }}>{effectiveLongestApp}</strong>.
          </div>
        )}
        {transitions.length > 0 && (
          <div className="insight-row">
            Most common switch: <strong style={{ color: 'var(--color-text)' }}>{transitions[0].from_app} → {transitions[0].to_app}</strong> ({transitions[0].count}×).
          </div>
        )}
      </div>
    </div>
  )
}
