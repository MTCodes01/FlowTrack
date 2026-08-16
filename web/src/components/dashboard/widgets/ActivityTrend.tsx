import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatTime } from '../../../utils/format'
import type { TrendPoint, Granularity, Metric } from '../../../types/dashboard'

interface Props {
  trend: TrendPoint[]
  granularity: Granularity
  metricMode: Metric
}

function xFormatter(label: string, granularity: Granularity): string {
  if (granularity === 'hourly') return `${label}:00`
  if (granularity === 'monthly') {
    const [, m] = label.split('-')
    return new Date(2000, parseInt(m) - 1, 1).toLocaleString('en-US', { month: 'short' })
  }
  const [, mo, da] = label.split('-')
  return `${parseInt(mo)}/${parseInt(da)}`
}

export default function ActivityTrend({ trend, granularity, metricMode }: Props) {
  return (
    <div className="bento-card col-span-4">
      <div className="card-title">
        Activity Trend
        <span style={{ color: 'var(--color-muted)', fontStyle: 'italic', marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>
          ({granularity})
        </span>
      </div>
      {trend.length === 0
        ? <div className="empty-state" style={{ padding: '40px 0' }}><h3>No activity in this period</h3></div>
        : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={trend} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis
                dataKey="label"
                tickFormatter={l => xFormatter(l, granularity)}
                tick={{ fontSize: 10, fill: '#8b949e' }}
                axisLine={false} tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={v => metricMode === 'time' ? formatTime(Number(v)) : String(v)}
                tick={{ fontSize: 10, fill: '#8b949e' }}
                axisLine={false} tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                formatter={(v: any) => [
                  metricMode === 'time' ? formatTime(Number(v)) : `${v} sessions`,
                  metricMode === 'time' ? 'Usage' : 'Sessions'
                ]}
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--color-text)', fontWeight: 600, marginBottom: 4 }}
                itemStyle={{ color: 'var(--color-accent)', fontWeight: 600 }}
                labelFormatter={l => xFormatter(String(l), granularity)}
              />
              <Bar
                dataKey={metricMode === 'time' ? 'total_seconds' : 'count'}
                fill="var(--color-accent)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )
      }
    </div>
  )
}
