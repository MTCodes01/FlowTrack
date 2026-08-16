import { useEffect, useState, useMemo } from 'react'
import {
  getHeatmapStats, getDailyStats, getWeeklyStats,
  getRangeSummary, getTrend, getGranularity,
  getCurrentActivityMock, getCategoryStatsMock,
  getAppTransitionsMock, getRecentSessionsMock,
  type HeatmapStat, type RangeSummary, type TrendPoint,
  type CurrentSession, type CategoryStat, type AppTransition, type RecentSession
} from '../api/client'
import type { DateRange, DayData, RangeApp, Granularity } from '../types/dashboard'

/** Build trend data client-side from the heatmap dayMap (fallback when API is unavailable) */
function computeFallbackTrend(
  dayMap: Map<string, DayData>,
  range: DateRange,
  granularity: Granularity,
  selectedApp: string
): TrendPoint[] {
  if (granularity === 'hourly') return []  // can't derive hourly from daily heatmap
  const result = new Map<string, { total_seconds: number; count: number }>()
  dayMap.forEach((data, dateKey) => {
    if (dateKey < range.start || dateKey > range.end) return
    const label = granularity === 'monthly' ? dateKey.substring(0, 7) : dateKey
    let secs = 0, cnt = 0
    if (selectedApp === 'All Apps') {
      Object.values(data.apps).forEach(a => { secs += a.seconds; cnt += a.count })
    } else if (data.apps[selectedApp]) {
      secs = data.apps[selectedApp].seconds; cnt = data.apps[selectedApp].count
    }
    if (secs > 0) {
      const prev = result.get(label) || { total_seconds: 0, count: 0 }
      result.set(label, { total_seconds: prev.total_seconds + secs, count: prev.count + cnt })
    }
  })
  return Array.from(result.entries())
    .map(([label, d]) => ({ label, ...d }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export interface DashboardDataResult {
  loading: boolean
  error: string
  // Raw heatmap data
  heatmap: HeatmapStat[]
  dayMap: Map<string, DayData>
  appTotalsMap: Map<string, { seconds: number; count: number }>
  uniqueApps: string[]
  // Client-side filtered stats (always available)
  rangeApps: RangeApp[]
  rangeTotal: number
  rangeTotalSessions: number
  rangeMaxSeconds: number
  rangeTopApp: string
  maxDateStr: string
  maxDaily: number
  totalTrackedTime: number
  // API data (may be null if endpoints aren't deployed)
  summary: RangeSummary | null
  trend: TrendPoint[]
  currentActivity: CurrentSession | null
  categoryStats: CategoryStat[]
  transitions: AppTransition[]
  recentSessions: RecentSession[]
  // Effective values: API data when available, client-side fallback otherwise
  effectiveTotalSeconds: number
  effectiveSessions: number
  effectiveAvgSession: number
  effectiveLongestSession: number
  effectiveLongestApp: string
  effectiveTrend: TrendPoint[]
  effectiveTopApp: string
  effectiveTopAppSeconds: number
  trendGranularity: Granularity
}

export function useDashboardData(
  token: string,
  activeRange: DateRange,
  selectedApp: string,
): DashboardDataResult {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [heatmap, setHeatmap] = useState<HeatmapStat[]>([])
  const [summary, setSummary] = useState<RangeSummary | null>(null)
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [currentActivity, setCurrentActivity] = useState<CurrentSession | null>(null)
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([])
  const [transitions, setTransitions] = useState<AppTransition[]>([])
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])

  // Fetch static/mock data once
  useEffect(() => {
    Promise.all([
      getHeatmapStats(token),
      getDailyStats(token),
      getWeeklyStats(token),
      getCurrentActivityMock(),
      getCategoryStatsMock(),
      getAppTransitionsMock(),
      getRecentSessionsMock()
    ]).then(([hData, , , currData, catData, transData, recData]) => {
      setHeatmap(hData || [])
      setCurrentActivity(currData)
      setCategoryStats(catData)
      setTransitions(transData)
      setRecentSessions(recData)
    }).catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  // Fetch range-dependent data whenever activeRange changes
  useEffect(() => {
    const { start, end } = activeRange
    const gran = getGranularity(start, end)
    Promise.all([
      getRangeSummary(token, start, end),
      getTrend(token, start, end, gran)
    ]).then(([sumData, trendData]) => {
      setSummary(sumData)
      setTrend(trendData || [])
    }).catch(() => {
      // Server doesn't have new endpoints yet — use client-side fallback
      setSummary(null)
      setTrend([])
    })
  }, [token, activeRange])

  // Build dayMap and appTotalsMap from heatmap
  const { dayMap, appTotalsMap } = useMemo(() => {
    const appTotalsMap = new Map<string, { seconds: number; count: number }>()
    const dayMap = new Map<string, DayData>()
    heatmap.forEach(h => {
      const dateKey = h.date.split('T')[0]
      const app = h.app_name
      const secs = h.total_seconds
      const cnt = h.count || 1
      const prevApp = appTotalsMap.get(app) || { seconds: 0, count: 0 }
      appTotalsMap.set(app, { seconds: prevApp.seconds + secs, count: prevApp.count + cnt })
      let day = dayMap.get(dateKey)
      if (!day) { day = { seconds: 0, count: 0, apps: {} }; dayMap.set(dateKey, day) }
      if (!day.apps[app]) day.apps[app] = { seconds: 0, count: 0 }
      day.apps[app].seconds += secs
      day.apps[app].count += cnt
    })
    return { dayMap, appTotalsMap }
  }, [heatmap])

  const uniqueApps = useMemo(() => Array.from(appTotalsMap.keys()).sort(), [appTotalsMap])

  // Range-filtered stats (client-side)
  const { rangeApps, rangeTotal, rangeTotalSessions, rangeMaxSeconds, rangeTopApp,
    maxDateStr, maxDaily, totalTrackedTime } = useMemo(() => {
    const rangeAppMap = new Map<string, { seconds: number; count: number }>()
    let rangeTotal = 0
    let maxDaily = 0, maxDailyDate = '', totalTrackedTime = 0

    dayMap.forEach((data, dateKey) => {
      let daySecs = 0
      if (dateKey >= activeRange.start && dateKey <= activeRange.end) {
        Object.entries(data.apps).forEach(([appName, appData]) => {
          if (selectedApp === 'All Apps' || selectedApp === appName) {
            const prev = rangeAppMap.get(appName) || { seconds: 0, count: 0 }
            rangeAppMap.set(appName, { seconds: prev.seconds + appData.seconds, count: prev.count + appData.count })
            rangeTotal += appData.seconds
            daySecs += appData.seconds
          }
        })
      }
      // Track all-time max day (unfiltered by date range, but filtered by app)
      let allDaySecs = 0
      let totalDaySecsForAllApps = 0
      
      Object.values(data.apps).forEach(a => { 
        totalDaySecsForAllApps += a.seconds 
      })

      if (selectedApp === 'All Apps') {
        allDaySecs = totalDaySecsForAllApps
      } else if (data.apps[selectedApp]) {
        allDaySecs = data.apps[selectedApp].seconds
      }
      if (allDaySecs > maxDaily) { maxDaily = allDaySecs; maxDailyDate = dateKey }
      totalTrackedTime += totalDaySecsForAllApps
    })

    const rangeApps: RangeApp[] = Array.from(rangeAppMap.entries())
      .map(([app_name, data]) => ({ app_name, total_seconds: data.seconds, count: data.count }))
      .sort((a, b) => b.total_seconds - a.total_seconds)

    let rangeTotalSessions = 0
    rangeAppMap.forEach(d => rangeTotalSessions += d.count)

    const rangeTopApp = rangeApps.length > 0 ? rangeApps[0].app_name : 'None'
    const rangeMaxSeconds = rangeApps.length > 0 ? rangeApps[0].total_seconds : 1

    let maxDateStr = 'None'
    if (maxDailyDate) {
      const [y, m, d] = maxDailyDate.split('-').map(Number)
      maxDateStr = new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    return { rangeApps, rangeTotal, rangeTotalSessions, rangeMaxSeconds, rangeTopApp, maxDateStr, maxDaily, totalTrackedTime }
  }, [dayMap, activeRange, selectedApp])

  // Effective values with client-side fallbacks
  const trendGranularity = getGranularity(activeRange.start, activeRange.end)

  const effectiveTrend = useMemo((): TrendPoint[] => {
    if (trend.length > 0) return trend
    return computeFallbackTrend(dayMap, activeRange, trendGranularity, selectedApp)
  }, [trend, dayMap, activeRange, trendGranularity, selectedApp])

  const effectiveSessions = summary?.total_sessions ?? rangeTotalSessions
  const effectiveAvgSession = summary?.avg_session ?? (rangeTotalSessions > 0 ? Math.floor(rangeTotal / rangeTotalSessions) : 0)
  const effectiveTotalSeconds = summary?.total_seconds ?? rangeTotal
  const effectiveLongestSession = summary?.longest_session ?? 0
  const effectiveLongestApp = summary?.longest_app ?? '—'
  const effectiveTopApp = summary?.top_app || rangeTopApp
  const effectiveTopAppSeconds = summary?.top_app_seconds ?? rangeMaxSeconds

  return {
    loading, error,
    heatmap, dayMap, appTotalsMap, uniqueApps,
    rangeApps, rangeTotal, rangeTotalSessions, rangeMaxSeconds, rangeTopApp,
    maxDateStr, maxDaily, totalTrackedTime,
    summary, trend, currentActivity, categoryStats, transitions, recentSessions,
    effectiveTotalSeconds, effectiveSessions, effectiveAvgSession,
    effectiveLongestSession, effectiveLongestApp, effectiveTrend,
    effectiveTopApp, effectiveTopAppSeconds, trendGranularity
  }
}
