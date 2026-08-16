import { formatTime } from '../../../utils/format'
import type { CurrentSession } from '../../../types/dashboard'

interface Props { currentActivity: CurrentSession | null }

export default function CurrentActivity({ currentActivity }: Props) {
  return (
    <div className="bento-card col-span-2">
      <div className="card-title">Currently Active</div>
      {!currentActivity
        ? <div className="skeleton skeleton-block" style={{ height: 120 }} />
        : currentActivity.is_active
          ? (
            <div className="current-activity">
              <div className="current-app-name">
                <div className="live-indicator" />
                {currentActivity.app_name}
              </div>
              <div className="current-duration">{formatTime(currentActivity.total_seconds)}</div>
              <div className="current-meta">
                Started at {new Date(currentActivity.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ marginTop: 24 }} className="current-meta">
                Today's Total:&nbsp;
                <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>
                  {formatTime(currentActivity.today_total_seconds)}
                </span>
              </div>
            </div>
          )
          : (
            <div className="current-activity">
              <div className="current-app-name" style={{ color: 'var(--color-muted)' }}>
                <div className="live-indicator" style={{ backgroundColor: 'var(--color-muted)', animation: 'none' }} />
                Idle
              </div>
              <div className="current-meta" style={{ marginTop: 8 }}>Tracking is currently paused.</div>
            </div>
          )
      }
    </div>
  )
}
