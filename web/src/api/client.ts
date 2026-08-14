const BASE_URL = import.meta.env.VITE_API_URL || ''

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
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

// ─── Stats ────────────────────────────────────────────────────────────────────

export const getDailyStats = (token: string) =>
  request<AppStat[]>('/api/v1/stats/daily', {}, token)

export const getWeeklyStats = (token: string) =>
  request<AppStat[]>('/api/v1/stats/weekly', {}, token)

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export const getLeaderboard = (token: string) =>
  request<LeaderboardEntry[]>('/api/v1/leaderboard', {}, token)
