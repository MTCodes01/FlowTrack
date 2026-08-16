import type { CategoryStat } from '../../../types/dashboard'

interface Props { stats: CategoryStat[] }

const CATEGORY_COLORS: Record<string, string> = {
  Development: 'var(--color-accent)',
  Browser: '#0ea5e9',
  Communication: '#ec4899',
  Entertainment: '#f59e0b',
  Other: '#8b949e',
}

export default function CategoryBreakdown({ stats }: Props) {
  return (
    <div className="bento-card col-span-2">
      <div className="card-title">Category Usage</div>
      {stats.length === 0
        ? <div className="empty-state" style={{ margin: 'auto' }}><h3>No data</h3></div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {stats.map(c => (
              <div key={c.category} className="category-row">
                <div className="category-header">
                  <span>{c.category}</span>
                  <span className="category-percentage">{c.percentage}%</span>
                </div>
                <div className="category-bar-bg">
                  <div
                    className="category-bar-fill"
                    style={{
                      width: `${c.percentage}%`,
                      background: CATEGORY_COLORS[c.category] ?? 'var(--color-accent)'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}
