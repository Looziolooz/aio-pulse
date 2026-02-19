import type { EngineId, ModelId } from '@/types'

export const APP_NAME = 'AIO Pulse'
export const APP_DESCRIPTION = 'Enterprise-grade AI Search Visibility & Optimization Platform'
export const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'

// ─── Navigation ───────────────────────────────────────────────────────────────

export const MAIN_NAV = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Optimizer', href: '/dashboard/optimizer' },
  { label: 'Monitor', href: '/dashboard/monitor' },
  { label: 'Analytics', href: '/dashboard/analytics' },
  { label: 'Competitor', href: '/dashboard/competitor' },
  { label: 'History', href: '/dashboard/history' },
] as const

// ─── Engines ──────────────────────────────────────────────────────────────────

export const ENGINES: Array<{
  id: EngineId
  label: string
  color: string
  accent: string
  description: string
}> = [
  {
    id: 'all',
    label: 'All Engines',
    color: 'bg-brand-500',
    accent: 'text-brand-400',
    description: 'Universal AIO strategy across all platforms.',
  },
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    color: 'bg-emerald-500',
    accent: 'text-emerald-400',
    description: 'SearchGPT & GPT-4o citation optimization.',
  },
  {
    id: 'gemini',
    label: 'Gemini',
    color: 'bg-blue-500',
    accent: 'text-blue-400',
    description: 'SGE, Knowledge Graph & Gemini Advanced.',
  },
  {
    id: 'perplexity',
    label: 'Perplexity',
    color: 'bg-purple-500',
    accent: 'text-purple-400',
    description: 'Fact-first real-time answer engine.',
  },
  {
    id: 'claude',
    label: 'Claude',
    color: 'bg-orange-500',
    accent: 'text-orange-400',
    description: 'Nuanced logical depth & reasoning chains.',
  },
]

// ─── Models ───────────────────────────────────────────────────────────────────

export const ANALYSIS_MODELS: Array<{ id: ModelId; label: string }> = [
  { id: 'default', label: 'AIO Pulse Standard' },
  { id: 'gpt-4o', label: 'GPT-4o (OpenAI)' },
  { id: 'gemini-pro', label: 'Gemini Pro (Google)' },
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet (Anthropic)' },
  { id: 'perplexity-sonar', label: 'Sonar Large (Perplexity)' },
]

// ─── Limits ───────────────────────────────────────────────────────────────────

export const MAX_COMPETITORS = 3
export const MAX_SCAN_HISTORY = 50
export const MAX_TEXT_LENGTH = 15_000
export const KEYWORD_DENSITY_TARGET = 2.5 // %
