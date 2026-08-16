import type { RangeSummary, TrendPoint, CurrentSession, CategoryStat, AppTransition, RecentSession, HeatmapStat } from '../api/client'

export type { RangeSummary, TrendPoint, CurrentSession, CategoryStat, AppTransition, RecentSession, HeatmapStat }

export type Metric = 'time' | 'frequency'
export type Granularity = 'hourly' | 'daily' | 'monthly'
export type DateRange = { start: string; end: string }

export interface DayData {
  seconds: number
  count: number
  apps: Record<string, { seconds: number; count: number }>
}

export interface RangeApp {
  app_name: string
  total_seconds: number
  count: number
}

export type WidgetId =
  | 'summary'
  | 'trend'
  | 'software'
  | 'current_activity'
  | 'categories'
  | 'hours'
  | 'heatmap'
  | 'recent'
  | 'insights'
  | 'footer'

export interface WidgetConfig {
  id: WidgetId
  label: string
  visible: boolean
}

export const DEFAULT_WIDGET_CONFIG: WidgetConfig[] = [
  { id: 'summary', label: 'Summary Cards', visible: true },
  { id: 'trend', label: 'Activity Trend', visible: true },
  { id: 'software', label: 'Software & Usage', visible: true },
  { id: 'current_activity', label: 'Currently Active', visible: true },
  { id: 'categories', label: 'Category Usage', visible: true },
  { id: 'hours', label: 'Most Active Hours', visible: true },
  { id: 'heatmap', label: 'Consistency Heatmap', visible: true },
  { id: 'recent', label: 'Recent Activity', visible: true },
  { id: 'insights', label: 'Insights', visible: true },
  { id: 'footer', label: 'Stats Footer', visible: true },
]

export function loadWidgetConfig(): WidgetConfig[] {
  try {
    const stored = localStorage.getItem('ft_widget_config')
    if (!stored) return DEFAULT_WIDGET_CONFIG
    const parsed: WidgetConfig[] = JSON.parse(stored)
    // Merge with defaults so new widgets always appear
    return DEFAULT_WIDGET_CONFIG.map(def => {
      const saved = parsed.find(p => p.id === def.id)
      return saved ? { ...def, visible: saved.visible } : def
    })
  } catch {
    return DEFAULT_WIDGET_CONFIG
  }
}

export function saveWidgetConfig(config: WidgetConfig[]): void {
  localStorage.setItem('ft_widget_config', JSON.stringify(config))
}
