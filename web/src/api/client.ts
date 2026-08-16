const DEFAULT_URL = import.meta.env.VITE_API_URL || 'http://localhost:27943'

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const baseUrl = localStorage.getItem('ft_server') || DEFAULT_URL

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${baseUrl}${path}`, { ...options, headers })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export interface AppStat {
  app_name: string
  total_seconds: number
}

export interface LeaderboardEntry {
  username: string
  total_seconds: number
}

export interface User {
  id: number
  username: string
  email: string
  preferences?: string
}

export interface AuthResponse {
  token: string
  user: User
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const login = (username: string, password: string) =>
  request<AuthResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })

export const register = (username: string, email: string, password: string) =>
  request<AuthResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  })

export const getMe = (token: string) =>
  request<User>('/api/v1/me', {}, token)

export const updatePreferences = (preferences: string, token: string) =>
  request<{ status: string }>('/api/v1/me/preferences', {
    method: 'PUT',
    body: JSON.stringify({ preferences }),
  }, token)

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface HeatmapStat {
  date: string
  app_name: string
  total_seconds: number
  count: number
}

export const getDailyStats = (token: string) =>
  request<AppStat[] | null>('/api/v1/stats/daily', {}, token)

export const getWeeklyStats = (token: string) =>
  request<AppStat[] | null>('/api/v1/stats/weekly', {}, token)

export const getHeatmapStats = (token: string) =>
  request<HeatmapStat[] | null>('/api/v1/stats/heatmap', {}, token)

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export const getLeaderboard = (token: string) =>
  request<LeaderboardEntry[] | null>('/api/v1/leaderboard', {}, token)

// ─── Real dashboard endpoints ─────────────────────────────────────────────────

export interface RangeSummary {
  total_seconds: number
  total_sessions: number
  avg_session: number
  longest_session: number
  longest_app: string
  top_app: string
  top_app_seconds: number
  prev_total_seconds: number
  prev_sessions: number
  prev_avg_session: number
}

export interface TrendPoint {
  label: string
  total_seconds: number
  count: number
}

export const getRangeSummary = (token: string, start: string, end: string) =>
  request<RangeSummary>(`/api/v1/stats/summary?start=${start}&end=${end}`, {}, token)

export const getTrend = (
  token: string,
  start: string,
  end: string,
  granularity: 'hourly' | 'daily' | 'monthly'
) =>
  request<TrendPoint[]>(`/api/v1/stats/trend?start=${start}&end=${end}&granularity=${granularity}`, {}, token)

/** Determine trend chart granularity based on how many days the range spans */
export function getGranularity(start: string, end: string): 'hourly' | 'daily' | 'monthly' {
  const days = (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000
  if (days <= 1) return 'hourly'
  if (days <= 90) return 'daily'
  return 'monthly'
}

// ─── Mock-only endpoints (no backend equivalent yet) ─────────────────────────
// These will be replaced once the agent/backend exposes live tracking state.

export interface CurrentSession {
  app_name: string
  start_time: string
  total_seconds: number
  is_active: boolean
  today_total_seconds: number
}

export interface CategoryStat {
  category: string
  total_seconds: number
  percentage: number
}

export interface AppTransition {
  from_app: string
  to_app: string
  count: number
}

export interface RecentSession {
  app_name: string
  start_time: string
  total_seconds: number
  is_active: boolean
}

export const getCurrentActivityMock = async (): Promise<CurrentSession> => {
  await new Promise(r => setTimeout(r, 100))
  return {
    app_name: 'Chrome',
    start_time: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    total_seconds: 42 * 60 + 18,
    is_active: true,
    today_total_seconds: 6 * 3600 + 2 * 60
  }
}

export const getCategoryStatsMock = async (): Promise<CategoryStat[]> => {
  await new Promise(r => setTimeout(r, 100))
  return [
    { category: 'Development', total_seconds: 14400, percentage: 48 },
    { category: 'Browser', total_seconds: 6300, percentage: 21 },
    { category: 'Communication', total_seconds: 3900, percentage: 13 },
    { category: 'Entertainment', total_seconds: 2700, percentage: 9 },
    { category: 'Other', total_seconds: 2700, percentage: 9 },
  ]
}

export const getAppTransitionsMock = async (): Promise<AppTransition[]> => {
  await new Promise(r => setTimeout(r, 100))
  return [
    { from_app: 'Chrome', to_app: 'VS Code', count: 34 },
    { from_app: 'VS Code', to_app: 'Chrome', count: 29 },
    { from_app: 'Chrome', to_app: 'Discord', count: 17 },
    { from_app: 'Discord', to_app: 'Chrome', count: 14 },
  ]
}

export const getRecentSessionsMock = async (): Promise<RecentSession[]> => {
  await new Promise(r => setTimeout(r, 100))
  const now = Date.now()
  return [
    { app_name: 'Chrome', start_time: new Date(now - 42 * 60 * 1000).toISOString(), total_seconds: 42 * 60, is_active: true },
    { app_name: 'VS Code', start_time: new Date(now - 90 * 60 * 1000).toISOString(), total_seconds: 31 * 60, is_active: false },
    { app_name: 'Discord', start_time: new Date(now - 120 * 60 * 1000).toISOString(), total_seconds: 12 * 60, is_active: false },
    { app_name: 'Chrome', start_time: new Date(now - 180 * 60 * 1000).toISOString(), total_seconds: 29 * 60, is_active: false },
    { app_name: 'VS Code', start_time: new Date(now - 240 * 60 * 1000).toISOString(), total_seconds: 41 * 60, is_active: false },
  ]
}





