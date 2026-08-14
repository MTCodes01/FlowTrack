// Shared TypeScript types used by both the web dashboard and desktop app.
// These mirror the Go API response structures.

export interface User {
  id:       number
  username: string
  email:    string
}

export interface AuthResponse {
  token: string
  user:  User
}

export interface Session {
  id:           number
  user_id:      number
  app_name:     string
  title:        string
  start_time:   string   // ISO 8601
  end_time:     string   // ISO 8601
  duration_secs: number
}

export interface AppStat {
  app_name:      string
  total_seconds: number
}

export interface LeaderboardEntry {
  username:      string
  total_seconds: number
}

export interface BatchSessionRequest {
  sessions: Array<{
    app_name:   string
    title:      string
    start_time: string
    end_time:   string
  }>
}

export interface HealthResponse {
  status:  string
  version: string
}
