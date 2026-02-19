'use client'

import { useState, useCallback } from 'react'
import { GitCompare, Plus, X, Trophy, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/index'
import { exportToJson } from '@/lib/export'
import { cn } from '@/lib/utils'
import type { CompetitorResult } from '@/lib/services/gemini'

// ─── Colors for competitors ───────────────────────────────────────────────────

const COMPETITOR_COLORS = ['#6366f1', '#10b981', '#f97316', '#a855f7']
const RANK_BADGES = ['🥇', '🥈', '🥉', '4️⃣']

// ─── Score Ring (compact) ─────────────────────────────────────────────────────

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 26
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: 68, height: 68 }}
    >
      <svg className="-rotate-90" height={68} width={68}>
        <circle cx={34} cy={34} fill="none" r={r} stroke="#1f2937" strokeWidth="6" />
        <circle
          cx={34}
          cy={34}
          fill="none"
          r={r}
          stroke={color}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="6"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <span className="absolute text-sm font-black text-white">{score}</span>
    </div>
  )
}

// ─── Result Card ──────────────────────────────────────────────────────────────

function ResultCard({
  result,
  rank,
  color,
  isPrimary,
}: {
  result: CompetitorResult
  rank: number
  color: string
  isPrimary: boolean
}) {
  const isWinner = rank === 0

  return (
    <Card className={cn('p-5 transition-all', isWinner && 'ring-1 ring-brand-500/40')}>
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-base">{RANK_BADGES[rank]}</span>
            {isPrimary && <Badge variant="brand">Your Site</Badge>}
            {isWinner && <Badge variant="success">Winner</Badge>}
          </div>
          <p className="truncate text-xs text-gray-500">{result.url}</p>
        </div>
        <ScoreRing color={color} score={result.score} />
      </div>

      {/* Summary */}
      <p className="mb-4 text-xs leading-relaxed text-gray-400">{result.summary}</p>

      {/* Engine mini bars */}
      <div className="space-y-2">
        {result.engineBreakdown.slice(0, 4).map((e) => (
          <div key={e.engine} className="flex items-center gap-2 text-xs">
            <span className="w-16 shrink-0 text-gray-500">{e.engine}</span>
            <div className="h-1 flex-1 rounded-full bg-gray-800">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${e.score}%`, background: color }}
              />
            </div>
            <span className="w-7 text-right font-bold text-gray-300">{e.score}</span>
          </div>
        ))}
      </div>

      {/* Top keywords */}
      {result.keywords.length > 0 && (
        <div className="mt-4 border-t border-gray-800 pt-3">
          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-600">
            Top Keywords
          </p>
          <div className="flex flex-wrap gap-1">
            {result.keywords.slice(0, 3).map((k) => (
              <span
                key={k.word}
                className="rounded border px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ borderColor: `${color}30`, color }}
              >
                {k.word}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompetitorPage() {
  const [primaryUrl, setPrimaryUrl] = useState('')
  const [competitorUrls, setCompetitorUrls] = useState([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<{
    primary: CompetitorResult
    competitors: CompetitorResult[]
  } | null>(null)

  const addCompetitor = () => {
    if (competitorUrls.length < 3) setCompetitorUrls((prev) => [...prev, ''])
  }
  const removeCompetitor = (i: number) =>
    setCompetitorUrls((prev) => prev.filter((_, idx) => idx !== i))
  const updateCompetitor = (i: number, val: string) => {
    setCompetitorUrls((prev) => prev.map((u, idx) => (idx === i ? val : u)))
  }

  const handleCompare = useCallback(async () => {
    const validCompetitors = competitorUrls.filter((u) => u.trim())
    if (!primaryUrl.trim() || validCompetitors.length === 0) return

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const res = await fetch('/api/competitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryUrl: primaryUrl.trim(),
          competitorUrls: validCompetitors,
        }),
      })

      const json = (await res.json()) as {
        success: boolean
        data?: { primary: CompetitorResult; competitors: CompetitorResult[] }
        message?: string
      }

      if (!json.success || !json.data) throw new Error(json.message ?? 'Comparison failed')
      setResults(json.data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [primaryUrl, competitorUrls])

  // Prepare radar data from results
  const radarData = results
    ? ['ChatGPT', 'Gemini', 'Perplexity', 'Claude'].map((engine) => {
        const point: Record<string, number | string> = { engine }
        const allResults = [results.primary, ...results.competitors]
        allResults.forEach((r, i) => {
          const match = r.engineBreakdown.find((e) => e.engine === engine)
          point[`site${i}`] = match?.score ?? 0
        })
        return point
      })
    : []

  // Rank all results by score
  const rankedResults = results
    ? [
        ...[
          { ...results.primary, isPrimary: true },
          ...results.competitors.map((c) => ({ ...c, isPrimary: false })),
        ],
      ].sort((a, b) => b.score - a.score)
    : []

  const winner = rankedResults[0]

  return (
    <div className="animate-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white">Competitor Comparison</h1>
        <p className="mt-1 text-gray-400">
          Benchmark your AI visibility against up to 3 competitors.
        </p>
      </div>

      {/* Input Card */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Primary URL */}
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-500">
              Your URL (Primary)
            </label>
            <input
              className="w-full rounded-xl border border-brand-500/30 bg-black/40 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="https://yoursite.com/page-to-analyze"
              type="url"
              value={primaryUrl}
              onChange={(e) => setPrimaryUrl(e.target.value)}
            />
          </div>

          {/* Competitors */}
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-500">
              Competitor URLs
            </label>
            <div className="space-y-2">
              {competitorUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className="flex-1 rounded-xl border border-gray-800 bg-black/40 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-gray-600"
                    placeholder={`https://competitor${i + 1}.com/their-page`}
                    type="url"
                    value={url}
                    onChange={(e) => updateCompetitor(i, e.target.value)}
                  />
                  {competitorUrls.length > 1 && (
                    <button
                      className="rounded-xl border border-gray-800 p-3 text-gray-500 transition-colors hover:border-red-500/30 hover:text-red-400"
                      onClick={() => removeCompetitor(i)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {competitorUrls.length < 3 && (
              <button
                className="mt-2 flex items-center gap-2 rounded-xl border border-dashed border-gray-700 px-4 py-2 text-sm text-gray-500 transition-colors hover:border-gray-500 hover:text-gray-300"
                onClick={addCompetitor}
              >
                <Plus className="h-4 w-4" /> Add competitor
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Each URL will be fetched and analyzed individually using Gemini AI.
          </p>
          <Button
            disabled={!primaryUrl.trim() || !competitorUrls.some((u) => u.trim())}
            loading={loading}
            size="lg"
            onClick={handleCompare}
          >
            <GitCompare className="h-5 w-5" />
            {loading ? 'Analyzing...' : 'Compare'}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {results && (
        <div className="animate-in space-y-6">
          {/* Winner banner */}
          {winner && (
            <div className="flex items-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-4">
              <Trophy className="h-8 w-8 text-emerald-400" />
              <div>
                <p className="font-bold text-emerald-300">
                  {winner.isPrimary ? '🎉 Your site leads!' : 'Competitor leads'} — Score:{' '}
                  {winner.score}/100
                </p>
                <p className="max-w-md truncate text-xs text-gray-500">{winner.url}</p>
              </div>
              <Button
                className="ml-auto"
                size="sm"
                variant="outline"
                onClick={() => exportToJson(results, 'competitor-analysis')}
              >
                Export JSON
              </Button>
            </div>
          )}

          {/* Result cards grid */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {rankedResults.map((r, i) => (
              <ResultCard
                key={r.url}
                color={COMPETITOR_COLORS[i] ?? '#6b7280'}
                isPrimary={r.isPrimary}
                rank={i}
                result={r}
              />
            ))}
          </div>

          {/* Radar comparison */}
          {radarData.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-6 text-lg font-bold text-white">Engine-by-Engine Radar</h2>
              <ResponsiveContainer height={320} width="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1f2937" />
                  <PolarAngleAxis dataKey="engine" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontSize: 9, fill: '#4b5563' }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid #1f2937',
                      borderRadius: 8,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {rankedResults.map((r, i) => (
                    <Radar
                      key={r.url}
                      dataKey={`site${i}`}
                      fill={COMPETITOR_COLORS[i] ?? '#6b7280'}
                      fillOpacity={0.15}
                      name={r.isPrimary ? 'Your Site' : `Competitor ${i}`}
                      stroke={COMPETITOR_COLORS[i] ?? '#6b7280'}
                      strokeWidth={2}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Delta Table */}
          <Card className="p-6">
            <h2 className="mb-5 text-lg font-bold text-white">Score Delta vs Your Site</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="pb-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">
                      URL
                    </th>
                    <th className="pb-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                      Score
                    </th>
                    <th className="pb-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                      Delta
                    </th>
                    <th className="pb-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                      Rank
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rankedResults.map((r, i) => {
                    const delta = r.score - results.primary.score
                    return (
                      <tr key={r.url} className="border-b border-gray-800/50">
                        <td className="max-w-[200px] truncate py-3 text-xs text-gray-300">
                          {r.url}
                        </td>
                        <td className="py-3 text-center font-black text-white">{r.score}</td>
                        <td className="py-3 text-center">
                          {r.isPrimary ? (
                            <span className="text-xs text-gray-500">baseline</span>
                          ) : (
                            <span
                              className={cn(
                                'flex items-center justify-center gap-1 text-xs font-bold',
                                delta > 0 ? 'text-red-400' : 'text-emerald-400',
                              )}
                            >
                              {delta > 0 ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              {delta > 0 ? '+' : ''}
                              {delta}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-center text-lg">{RANK_BADGES[i]}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
