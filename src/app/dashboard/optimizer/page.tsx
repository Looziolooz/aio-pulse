'use client'

import { useState, useCallback } from 'react'
import {
  FileSearch,
  Globe,
  Link2,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  Download,
  ChevronDown,
  ChevronUp,
  Target,
  TrendingUp,
  Brain,
  Users,
  BookOpen,
  Mic,
} from 'lucide-react'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/index'
import { useAppStore } from '@/lib/store'
import { useToggle, useClipboard, useKeywordAnalysis } from '@/hooks'
import { exportAnalysisToCsv } from '@/lib/export'
import { cn } from '@/lib/utils'
import { ENGINES, ANALYSIS_MODELS } from '@/lib/constants'
import type { AnalysisResult, EngineId, ModelId } from '@/types'

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#6366f1' : '#f43f5e'

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg className="-rotate-90" height={size} width={size}>
        <circle
          className="text-gray-800"
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={r}
          stroke="currentColor"
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={r}
          stroke={color}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="8"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-black text-white">{score}</span>
        <span className="block text-[9px] font-bold uppercase tracking-widest text-gray-500">
          Score
        </span>
      </div>
    </div>
  )
}

// ─── Engine Card ──────────────────────────────────────────────────────────────

function EngineCard({ breakdown }: { breakdown: AnalysisResult['engineBreakdown'][0] }) {
  const statusColor = {
    optimal: 'success',
    'needs-work': 'warning',
    critical: 'danger',
  }[breakdown.status] as 'success' | 'warning' | 'danger'

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-semibold text-white">{breakdown.engine}</span>
        <div className="flex items-center gap-2">
          <Badge variant={statusColor}>{breakdown.status}</Badge>
          <span className="text-lg font-black text-white">{breakdown.score}</span>
        </div>
      </div>
      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700',
            breakdown.score >= 80
              ? 'bg-emerald-500'
              : breakdown.score >= 50
                ? 'bg-brand-500'
                : 'bg-rose-500',
          )}
          style={{ width: `${breakdown.score}%` }}
        />
      </div>
      <p className="text-xs text-gray-400">{breakdown.details}</p>
    </div>
  )
}

// ─── Keyword Row ──────────────────────────────────────────────────────────────

function KeywordRow({ kw }: { kw: { word: string; impact: number; difficulty: number } }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-800/50 bg-gray-900/30 px-3 py-2">
      <span className="flex-1 text-sm font-medium text-gray-200">{kw.word}</span>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-emerald-400">Impact {kw.impact}</span>
        <span className="text-gray-600">|</span>
        <span className="text-amber-400">Diff {kw.difficulty}</span>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OptimizerPage() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'text' | 'url'>('text')
  const [engine, setEngine] = useState<EngineId>('all')
  const [model, setModel] = useState<ModelId>('default')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const { value: showDetails, set: setShowDetails, toggle: toggleDetails } = useToggle(false)

  const { copied, copy } = useClipboard()
  const addScan = useAppStore((s) => s.addScan)

  const { radarData } = useKeywordAnalysis(
    result?.keywords ?? [],
    result?.analyzedText,
    result?.visibilityScore ?? 0,
  )

  const handleAnalyze = useCallback(async () => {
    if (!input.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.trim(), mode, engine, model }),
      })

      const json = (await res.json()) as {
        success: boolean
        data?: AnalysisResult
        message?: string
      }

      if (!json.success || !json.data) {
        throw new Error(json.message ?? 'Analysis failed')
      }

      setResult(json.data)
      addScan(json.data, engine, model)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [input, mode, engine, model, addScan])

  const charCount = input.length
  const charLimit = 15000

  return (
    <div className="animate-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white">Content Optimizer</h1>
        <p className="mt-1 text-gray-400">
          Analyze content for AI search visibility & citation readiness.
        </p>
      </div>

      {/* Input Card */}
      <Card className="p-6">
        {/* Mode Toggle */}
        <div className="mb-6 flex items-center gap-2">
          {(['text', 'url'] as const).map((m) => (
            <button
              key={m}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all',
                mode === m
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                  : 'border border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-white',
              )}
              onClick={() => setMode(m)}
            >
              {m === 'text' ? <FileSearch className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              {m === 'text' ? 'Paste Text' : 'Analyze URL'}
            </button>
          ))}
        </div>

        {/* Input */}
        {mode === 'text' ? (
          <div className="space-y-1">
            <textarea
              className="w-full resize-none rounded-xl border border-gray-800 bg-black/40 px-4 py-3 font-mono text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              maxLength={charLimit}
              placeholder="Paste your content here — article, landing page copy, blog post, product description..."
              rows={10}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="flex justify-end">
              <span
                className={cn(
                  'text-xs',
                  charCount > charLimit * 0.9 ? 'text-amber-400' : 'text-gray-600',
                )}
              >
                {charCount.toLocaleString()} / {charLimit.toLocaleString()}
              </span>
            </div>
          </div>
        ) : (
          <input
            className="w-full rounded-xl border border-gray-800 bg-black/40 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            placeholder="https://example.com/your-page"
            type="url"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        )}

        {/* Options row */}
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          {/* Engine */}
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Target Engine
            </label>
            <div className="flex flex-wrap gap-2">
              {ENGINES.map((e) => (
                <button
                  key={e.id}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-xs font-bold transition-all',
                    engine === e.id
                      ? 'border-brand-500/50 bg-brand-500/15 text-brand-400'
                      : 'border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300',
                  )}
                  onClick={() => setEngine(e.id)}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Model */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Analysis Model
            </label>
            <select
              className="rounded-xl border border-gray-800 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
              value={model}
              onChange={(e) => setModel(e.target.value as ModelId)}
            >
              {ANALYSIS_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <Button
            className="sm:w-48"
            disabled={!input.trim()}
            loading={loading}
            size="lg"
            onClick={handleAnalyze}
          >
            <Sparkles className="h-5 w-5" />
            {loading ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
      </Card>

      {/* Results */}
      {result && (
        <div className="animate-in space-y-6">
          {/* Top row: score + summary */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Score */}
            <Card className="flex flex-col items-center justify-center p-8">
              <ScoreRing score={result.visibilityScore} size={140} />
              <p className="mt-4 text-center text-sm font-semibold text-gray-400">
                Overall Visibility Score
              </p>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copy(JSON.stringify(result, null, 2))}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => exportAnalysisToCsv(result)}>
                  <Download className="h-3.5 w-3.5" />
                  CSV
                </Button>
              </div>
            </Card>

            {/* Summary */}
            <Card className="p-6 lg:col-span-2">
              <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                AI Summary
              </p>
              <p className="leading-relaxed text-gray-200">{result.summary}</p>

              {/* Meta badges */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    icon: Target,
                    label: 'Intent',
                    value: result.intent,
                    conf: result.intentConfidence,
                  },
                  {
                    icon: BookOpen,
                    label: 'Type',
                    value: result.contentType,
                    conf: result.contentTypeConfidence,
                  },
                  { icon: Mic, label: 'Tone', value: result.tone, conf: result.toneConfidence },
                  { icon: Brain, label: 'Level', value: result.readingLevel, conf: null },
                ].map(({ icon: Icon, label, value, conf }) => (
                  <div key={label} className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
                    <Icon className="mb-1.5 h-3.5 w-3.5 text-gray-500" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                      {label}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
                    {conf !== null && conf !== undefined && (
                      <p className="text-[10px] text-gray-600">{conf}% confidence</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/30 px-3 py-2">
                <Users className="h-3.5 w-3.5 text-gray-500" />
                <p className="text-xs text-gray-400">
                  <span className="font-semibold text-gray-300">Audience: </span>
                  {result.audience}
                </p>
              </div>
            </Card>
          </div>

          {/* Engine Breakdown */}
          <div>
            <h2 className="mb-4 text-lg font-bold text-white">Engine-by-Engine Breakdown</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {result.engineBreakdown.map((b) => (
                <EngineCard key={b.engine} breakdown={b} />
              ))}
            </div>
          </div>

          {/* Keywords + Radar */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Keywords */}
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Keywords</h2>
                <Badge variant="brand">{result.keywords.length} found</Badge>
              </div>
              <div className="space-y-2">
                {result.keywords.map((kw) => (
                  <KeywordRow key={kw.word} kw={kw} />
                ))}
              </div>
              {result.intentSignals.length > 0 && (
                <div className="mt-5 border-t border-gray-800 pt-4">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Intent Signals
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.intentSignals.map((s) => (
                      <span
                        key={s}
                        className="rounded-lg border border-gray-800 bg-gray-900/50 px-2 py-0.5 text-xs text-gray-400"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Radar Chart */}
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-bold text-white">SEO Radar</h2>
              <ResponsiveContainer height={260} width="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1f2937" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Radar
                    dataKey="A"
                    fill="#6366f1"
                    fillOpacity={0.25}
                    name="Score"
                    stroke="#6366f1"
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid #1f2937',
                      borderRadius: 8,
                    }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Suggestions */}
          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                <TrendingUp className="mr-2 inline h-5 w-5 text-brand-400" />
                Improvement Suggestions
              </h2>
              <button
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
                onClick={toggleDetails}
              >
                {showDetails ? 'Collapse' : 'Expand all'}
                {showDetails ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <div className="space-y-3">
              {result.suggestions.map((s, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 rounded-xl border border-gray-800 bg-gray-900/40 px-4 py-3"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600/20 text-[11px] font-black text-brand-400">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-gray-300">{s}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
