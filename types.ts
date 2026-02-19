
export interface AIOScore {
  engine: string;
  score: number;
  status: 'optimal' | 'needs-work' | 'critical';
  details: string;
}

export interface AnalysisResult {
  source: string;
  type: 'url' | 'text';
  summary: string;
  visibilityScore: number;
  engineBreakdown: AIOScore[];
  suggestions: string[];
  keywords: { word: string; impact: number; difficulty: number }[];
  analyzedText: string;
  intent: 'Informational' | 'Navigational' | 'Transactional' | 'Commercial' | 'Mixed';
  intentConfidence: number;
  intentSignals: string[];
  contentType: string;
  contentTypeConfidence: number;
  tone: string;
  toneConfidence: number;
  readingLevel: string;
  audience: string;
}

export interface DashboardData {
  visibility: string;
  visibilityChange: number;
  citations: string;
  citationsChange: number;
  authority: number;
  authorityChange: number;
  rank: string;
  rankChange: number;
  growthChart: { name: string; visibility: number; citations: number }[];
  engineStats: { name: string; score: number; color: string }[];
  latestInsights: { type: 'success' | 'warning'; text: string }[];
}

export interface EngineHealth {
  id: string;
  name: string;
  status: 'Operational' | 'Degraded' | 'Down';
  latency: string;
  freshness: string;
  color: string;
  performanceData: { value: number }[];
}

export interface ActivityLogEntry {
  id: number;
  time: string;
  event: string;
  engine: string;
  detail: string;
}

export interface MonitorData {
  engines: EngineHealth[];
  logs: ActivityLogEntry[];
  cpuUsage: number;
  successRate: number;
  maintenanceAlert: string;
}

export interface AnalyticsData {
  visibilityTrend: { date: string; desktop: number; mobile: number; ai: number }[];
  distribution: { name: string; value: number; color: string }[];
  keywords: { name: string; rank: number; volume: string; impact: number }[];
}

export type ViewType = 'dashboard' | 'optimizer' | 'monitor' | 'analytics';
