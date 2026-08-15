import { useEffect, useState } from 'react'
import { getLeaderboard, type LeaderboardEntry } from '../api/client'

interface Props { token: string }

function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function rankClass(i: number): string {
  if (i === 0) return 'gold'
  if (i === 1) return 'silver'
  if (i === 2) return 'bronze'
  return ''
}

function rankEmoji(i: number): string {
  return `#${i + 1}`
}

export default function Leaderboard({ token }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getLeaderboard(token)
      .then((data) => setEntries(data || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <div className="spinner" />

  return (
    <>
      <div className="page-header">
        <h1>Leaderboard</h1>
        <p>Top users by tracked time this week</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {entries.length === 0
          ? <div className="empty-state"><h3>No data yet</h3><p>Track some time to appear on the leaderboard</p></div>
          : entries.map((entry, i) => (
            <div className={`leaderboard-row ${rankClass(i)}`} key={entry.username}>
              <div className="leaderboard-rank">{rankEmoji(i)}</div>
              <div className="leaderboard-avatar">{entry.username[0].toUpperCase()}</div>
              <div className="leaderboard-name">@{entry.username}</div>
              <div className="leaderboard-time">{formatTime(entry.total_seconds)}</div>
            </div>
          ))
        }
      </div>
    </>
  )
}
