'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  Smile, Frown, Meh, Brain, Loader2, Zap,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/index'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Brand } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SentimentStats {
  sentimentCounts: { positive: number; negative: number; neutral: number }
  avgSentimentScore: number
  hallucinationCount: number
  hallucinationRate: number
  byEngine: Record<string, { avg: number; count: number }>
  totalResults: number
  mentionedResults: number
}

interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral'
  score: number
  confidence: number
  reasoning: string
  aspects: Array<{ aspect: string; sentiment: string; explanation: string }>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SENTIMENT_CONFIG = {
  positive: { icon: Smile, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', bar: '#10b981' },
  negative: { icon: Frown, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', bar: '#f43f5e' },
  neutral: { icon: Meh, color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-700', bar: '#6b7280' },
}

const ENGINE_COLORS: Record<string, string> = {
  chatgpt: '#10b981', gemini: '#3b82f6', perplexity: '#a855f7',
}

const TOOLTIP_STYLE = {
  contentStyle: { background: '#0f172a', border: '1px solid #1f2937', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#e2e8f0', fontWeight: 700 },
}

// ─── Gauge ────────────────────────────────────────────────────────────────────

function SentimentGauge({ score }: { score: number }) {
  // score: -1 to 1, convert to 0–180 degrees
  const deg = ((score + 1) / 2) * 180
  const color = score > 0.2 ? '#10b981' : score < -0.2 ? '#f43f5e' : '#6b7280'

  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-48">
        {/* Track */}
        <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#1f2937" strokeWidth="14" strokeLinecap="round" />
        {/* Fill */}
        <path
          d="M 10 100 A 90 90 0 0 1 190 100"
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${(deg / 180) * 283} 283`}
          style={{ transition: 'all 1s ease' }}
        />
        {/* Needle */}
        <line
          x1="100" y1="100"
          x2={100 + 70 * Math.cos(((deg - 180) * Math.PI) / 180)}
          y2={100 + 70 * Math.sin(((deg - 180) * Math.PI) / 180)}
          stroke={color} strokeWidth="3" strokeLinecap="round"
          style={{ transition: 'all 1s ease' }}
        />
        <circle cx="100" cy="100" r="5" fill={color} />
        {/* Labels */}
        <text x="6" y="115" fontSize="10" fill="#6b7280">Neg</text>
        <text x="89" y="18" fontSize="10" fill="#6b7280">Neu</text>
        <text x="175" y="115" fontSize="10" fill="#6b7280">Pos</text>
      </svg>
      <div className="mt-1 text-center">
        <p className="text-3xl font-black" style={{ color }}>
          {score > 0 ? '+' : ''}{score.toFixed(2)}
        </p>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Sentiment Score</p>
      </div>
    </div>
  )
}

// ─── Manual analyzer ──────────────────────────────────────────────────────────

function ManualAnalyzer({ brands }: { brands: Brand[] }) {
  const [text, setText] = useState('')
  const [brandId, setBrandId] = useState('')
  const [mode, setMode] = useState<'both' | 'sentiment' | 'hallucination'>('both')
  const [result, setResult] = useState<{ sentiment?: SentimentAnalysis; hallucination?: { has_hallucination: boolean; confidence: number; flags: Array<{ text: string; severity: string; type: string }>; summary: string } } | null>(null)
  const [loading, setLoading] = useState(false)

  const analyze = async () => {
    if (!text.trim() || !brandId) { toast.error('Enter text and select a brand'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, brand_id: brandId, mode }),
      })
      const json = await res.json() as { success: boolean; data?: typeof result; message?: string }
      if (!json.success) throw new Error(json.message)
      setResult(json.data ?? null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center gap-3">
        <Brain className="h-5 w-5 text-brand-400" />
        <h2 className="text-lg font-bold text-white">Manual Analyzer</h2>
        <span className="text-xs text-gray-500">Paste any AI response to analyze</span>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Brand</label>
            <select
              className="w-full rounded-xl border border-gray-800 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-500"
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
            >
              <option value="">Select brand...</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Analysis Mode</label>
            <div className="flex gap-2">
              {(['both', 'sentiment', 'hallucination'] as const).map((m) => (
                <button
                  key={m}
                  className={cn(
                    'flex-1 rounded-xl border py-2.5 text-xs font-bold transition-all',
                    mode === m ? 'border-brand-500/50 bg-brand-500/15 text-brand-400' : 'border-gray-800 text-gray-500 hover:text-gray-300',
                  )}
                  onClick={() => setMode(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <textarea
          className="w-full resize-none rounded-xl border border-gray-800 bg-black/40 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-500"
          placeholder="Paste an AI-generated response here to analyze sentiment and detect hallucinations..."
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <Button className="w-full" loading={loading} onClick={analyze}>
          <Zap className="h-4 w-4" />
          {loading ? 'Analyzing...' : 'Analyze Text'}
        </Button>
      </div>

      {result && (
        <div className="mt-6 space-y-4 border-t border-gray-800 pt-5 animate-in">
          {result.sentiment && (
            <div>
              <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Sentiment Result</p>
              <div className={cn('rounded-xl border p-4', SENTIMENT_CONFIG[result.sentiment.sentiment].border, SENTIMENT_CONFIG[result.sentiment.sentiment].bg)}>
                <div className="mb-2 flex items-center justify-between">
                  <span className={cn('text-lg font-black capitalize', SENTIMENT_CONFIG[result.sentiment.sentiment].color)}>
                    {result.sentiment.sentiment}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">Score: {result.sentiment.score > 0 ? '+' : ''}{result.sentiment.score.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Confidence: {result.sentiment.confidence}%</p>
                  </div>
                </div>
                <p className="text-sm text-gray-300">{result.sentiment.reasoning}</p>
                {result.sentiment.aspects.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {result.sentiment.aspects.map((a, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className={cn('font-bold', SENTIMENT_CONFIG[a.sentiment as keyof typeof SENTIMENT_CONFIG]?.color ?? 'text-gray-400')}>{a.aspect}:</span>
                        <span className="text-gray-400">{a.explanation}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {result.hallucination && (
            <div>
              <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Hallucination Check</p>
              <div className={cn('rounded-xl border p-4', result.hallucination.has_hallucination ? 'border-red-500/20 bg-red-500/5' : 'border-emerald-500/20 bg-emerald-500/5')}>
                <div className="mb-2 flex items-center gap-2">
                  {result.hallucination.has_hallucination
                    ? <AlertTriangle className="h-4 w-4 text-red-400" />
                    : <span className="text-emerald-400">✓</span>
                  }
                  <span className={cn('font-bold', result.hallucination.has_hallucination ? 'text-red-300' : 'text-emerald-300')}>
                    {result.hallucination.has_hallucination ? `${result.hallucination.flags.length} issue(s) detected` : 'No hallucinations detected'}
                  </span>
                  <span className="ml-auto text-xs text-gray-500">Confidence: {result.hallucination.confidence}%</span>
                </div>
                <p className="text-sm text-gray-400">{result.hallucination.summary}</p>
                {result.hallucination.flags.map((flag, i) => (
                  <div key={i} className="mt-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs">
                    <p className="font-bold text-red-300">"{flag.text}"</p>
                    <p className="mt-0.5 text-gray-500">{flag.type} · {flag.severity} severity</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SentimentPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrand, setSelectedBrand] = useState('')
  const [stats, setStats] = useState<SentimentStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => {
    fetch('/api/brands')
      .then((r) => r.json() as Promise<{ data?: Brand[] }>)
      .then((j) => { setBrands(j.data ?? []); if (j.data?.[0]) setSelectedBrand(j.data[0].id) })
      .catch(() => {})
  }, [])

  const loadStats = useCallback(async (brandId: string) => {
    if (!brandId) return
    setLoadingStats(true)
    try {
      const res = await fetch(`/api/sentiment?brand_id=${brandId}`)
      const json = await res.json() as { success: boolean; data?: SentimentStats }
      if (json.success) setStats(json.data ?? null)
    } catch { /* ignore */ }
    finally { setLoadingStats(false) }
  }, [])

  useEffect(() => { if (selectedBrand) void loadStats(selectedBrand) }, [selectedBrand, loadStats])

  const pieData = stats ? [
    { name: 'Positive', value: stats.sentimentCounts.positive, color: '#10b981' },
    { name: 'Neutral', value: stats.sentimentCounts.neutral, color: '#6b7280' },
    { name: 'Negative', value: stats.sentimentCounts.negative, color: '#f43f5e' },
  ] : []

  const engineData = stats
    ? Object.entries(stats.byEngine).map(([engine, d]) => ({
        engine,
        score: parseFloat(d.avg.toFixed(2)),
        count: d.count,
        color: ENGINE_COLORS[engine] ?? '#6366f1',
      }))
    : []

  return (
    <div className="animate-in space-y-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Sentiment & Hallucinations</h1>
          <p className="mt-1 text-gray-400">How AI systems feel about your brand — and what they get wrong.</p>
        </div>
        {brands.length > 0 && (
          <select
            className="rounded-xl border border-gray-800 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-500"
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
          >
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
      </div>

      {loadingStats ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-brand-400" /></div>
      ) : stats ? (
        <>
          {/* Top row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Gauge */}
            <Card className="flex flex-col items-center justify-center p-8">
              <SentimentGauge score={stats.avgSentimentScore} />
              <div className="mt-6 flex gap-4 text-center">
                <div>
                  <p className="text-lg font-black text-emerald-400">{stats.sentimentCounts.positive}</p>
                  <p className="text-[10px] text-gray-600">Positive</p>
                </div>
                <div>
                  <p className="text-lg font-black text-gray-400">{stats.sentimentCounts.neutral}</p>
                  <p className="text-[10px] text-gray-600">Neutral</p>
                </div>
                <div>
                  <p className="text-lg font-black text-red-400">{stats.sentimentCounts.negative}</p>
                  <p className="text-[10px] text-gray-600">Negative</p>
                </div>
              </div>
            </Card>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4 lg:col-span-2">
              {[
                { label: 'Total Analyzed', value: stats.totalResults, icon: Brain, color: 'text-brand-400' },
                { label: 'With Brand Mention', value: stats.mentionedResults, icon: Smile, color: 'text-emerald-400' },
                { label: 'Hallucinations', value: stats.hallucinationCount, icon: AlertTriangle, color: 'text-red-400' },
                { label: 'Hallucination Rate', value: `${(stats.hallucinationRate * 100).toFixed(1)}%`, icon: AlertTriangle, color: stats.hallucinationRate > 0.1 ? 'text-red-400' : 'text-emerald-400' },
              ].map((s) => (
                <Card key={s.label} className="p-5">
                  <s.icon className={cn('mb-2 h-5 w-5', s.color)} />
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Sentiment by engine */}
          {engineData.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-6 text-lg font-bold text-white">Average Sentiment by Engine</h2>
              <ResponsiveContainer height={220} width="100%">
                <BarChart data={engineData}>
                  <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                  <XAxis dataKey="engine" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis domain={[-1, 1]} tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2), 'Score']} />
                  <Bar dataKey="score" name="Sentiment Score" radius={[4, 4, 0, 0]}>
                    {engineData.map((entry) => (
                      <Cell key={entry.engine} fill={entry.score > 0 ? '#10b981' : entry.score < 0 ? '#f43f5e' : '#6b7280'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* No data nudge */}
          {stats.totalResults === 0 && (
            <div className="rounded-2xl border border-gray-800 bg-gray-900/40 px-6 py-10 text-center">
              <p className="mb-2 text-lg font-bold text-white">No data yet</p>
              <p className="text-gray-500">Run monitoring checks from the Prompts page to populate sentiment data.</p>
            </div>
          )}
        </>
      ) : null}

      {/* Manual analyzer always visible */}
      <ManualAnalyzer brands={brands} />
    </div>
  )
}
