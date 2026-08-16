import { formatTime } from '../../../utils/format'
import type { RecentSession } from '../../../types/dashboard'

interface Props { sessions: RecentSession[] }

export default function RecentActivity({ sessions }: Props) {
  return (
    <div className="bento-card col-span-2">
      <div className="card-title">Recent Activity</div>
      <div>
        {sessions.map((r, i) => (
          <div key={i} className="recent-activity-row">
            <div className="recent-header">
              <span style={{ color: r.is_active ? 'var(--color-accent)' : 'inherit' }}>{r.app_name}</span>
              <span>
                {formatTime(r.total_seconds)}
                {r.is_active && <span style={{ color: 'var(--color-accent)', fontSize: 10, marginLeft: 6 }}>● ACTIVE</span>}
              </span>
            </div>
            <div className="recent-meta">
              {new Date(r.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
