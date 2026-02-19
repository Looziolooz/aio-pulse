'use client'

import { useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, Award, BarChart2, Globe, Zap } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/index'
import { useAppStore } from '@/lib/store'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

// ─── Static Demo Data ─────────────────────────────────────────────────────────

const GROWTH_DATA = [
  { month: 'Sep', visibility: 52, citations: 320, traditional: 68 },
  { month: 'Oct', visibility: 58, citations: 440, traditional: 67 },
  { month: 'Nov', visibility: 61, citations: 520, traditional: 65 },
  { month: 'Dec', visibility: 67, citations: 680, traditional: 63 },
  { month: 'Jan', visibility: 74, citations: 890, traditional: 61 },
  { month: 'Feb', visibility: 84, citations: 1240, traditional: 59 },
]

const ENGINE_DATA = [
  { engine: 'ChatGPT', score: 89, citations: 512, color: '#10b981' },
  { engine: 'Gemini', score: 74, citations: 380, color: '#3b82f6' },
  { engine: 'Perplexity', score: 82, citations: 241, color: '#a855f7' },
  { engine: 'Claude', score: 91, citations: 107, color: '#f97316' },
]

const INTENT_DATA = [
  { name: 'Informational', value: 48, color: '#6366f1' },
  { name: 'Commercial', value: 22, color: '#10b981' },
  { name: 'Transactional', value: 18, color: '#f97316' },
  { name: 'Navigational', value: 12, color: '#a855f7' },
]

const CONTENT_DATA = [
  { type: 'Articles', aio: 88, traditional: 72 },
  { type: 'Guides', aio: 92, traditional: 68 },
  { type: 'Product', aio: 71, traditional: 81 },
  { type: 'Landing', aio: 65, traditional: 76 },
  { type: 'Blog', aio: 84, traditional: 70 },
]

// ─── Tooltip Style ────────────────────────────────────────────────────────────

const tooltipStyle = {
  contentStyle: { background: '#0f172a', border: '1px solid #1f2937', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#e2e8f0', fontWeight: 700 },
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ title, value, change, suffix = '' }: {
  title: string; value: string | number; change: number; suffix?: string
}) {
  const isPos = change > 0
  const isNeutral = change === 0
  const TrendIcon = isNeutral ? Minus : isPos ? TrendingUp : TrendingDown

  return (
    <Card className="p-5">
      <p className="mb-3 text-sm font-medium text-gray-400">{title}</p>
      <p className="text-3xl font-black text-white">{value}{suffix}</p>
      <div className={cn(
        'mt-2 flex items-center gap-1 text-xs font-bold',
        isPos ? 'text-emerald-400' : isNeutral ? 'text-gray-500' : 'text-red-400',
      )}>
        <TrendIcon className="h-3.5 w-3.5" />
        {isPos ? '+' : ''}{change}% vs last month
      </div>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const scanHistory = useAppStore((s) => s.scanHistory)

  // Derive real stats from scan history if available
  const avgScore = useMemo(() => {
    if (scanHistory.length === 0) return 84
    return Math.round(scanHistory.reduce((a, s) => a + s.visibilityScore, 0) / scanHistory.length)
  }, [scanHistory])

  const totalScans = scanHistory.length

  return (
    <div className="animate-in space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Analytics</h1>
          <p className="mt-1 text-gray-400">Cross-platform AI visibility metrics and trend analysis.</p>
        </div>
        {totalScans > 0 && (
          <Badge variant="brand">{totalScans} scan{totalScans > 1 ? 's' : ''} in history</Badge>
        )}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard title="AI Visibility Score" value={avgScore} change={12} suffix="%" />
        <StatCard title="Direct Citations" value="2,847" change={23} />
        <StatCard title="AEO Authority" value={91} change={5} suffix="/100" />
        <StatCard title="Avg. Rank Position" value="#2.4" change={-0.3} />
      </div>

      {/* Visibility Growth vs Traditional SEO */}
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">AI Visibility vs Traditional SEO</h2>
            <p className="text-sm text-gray-500">6-month convergence trend</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-brand-400">
              <span className="inline-block h-2 w-4 rounded bg-brand-500" /> AI Visibility
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-gray-500">
              <span className="inline-block h-2 w-4 rounded bg-gray-600" /> Traditional SEO
            </span>
          </div>
        </div>
        <ResponsiveContainer height={280} width="100%">
          <LineChart data={GROWTH_DATA}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
            <Tooltip {...tooltipStyle} />
            <Line
              dataKey="visibility"
              dot={{ fill: '#6366f1', strokeWidth: 2 }}
              name="AI Visibility"
              stroke="#6366f1"
              strokeWidth={2.5}
              type="monotone"
            />
            <Line
              dataKey="traditional"
              dot={false}
              name="Traditional SEO"
              stroke="#374151"
              strokeDasharray="4 4"
              strokeWidth={2}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Middle row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Engine Performance Bar */}
        <Card className="p-6">
          <h2 className="mb-6 text-lg font-bold text-white">Engine Performance</h2>
          <ResponsiveContainer height={220} width="100%">
            <BarChart data={ENGINE_DATA} layout="vertical">
              <CartesianGrid horizontal={false} stroke="#1f2937" />
              <XAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b7280' }} type="number" />
              <YAxis dataKey="engine" tick={{ fontSize: 11, fill: '#9ca3af' }} type="category" width={70} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="score" name="Score" radius={[0, 4, 4, 0]}>
                {ENGINE_DATA.map((entry) => (
                  <Cell key={entry.engine} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Intent Distribution Pie */}
        <Card className="p-6">
          <h2 className="mb-6 text-lg font-bold text-white">Content Intent Distribution</h2>
          <div className="flex items-center gap-6">
            <ResponsiveContainer height={200} width="60%">
              <PieChart>
                <Pie
                  cx="50%"
                  cy="50%"
                  data={INTENT_DATA}
                  dataKey="value"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {INTENT_DATA.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, 'Share']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {INTENT_DATA.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-xs text-gray-400">{d.name}</span>
                  </div>
                  <span className="text-xs font-bold text-white">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Content Type Performance */}
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">AIO vs Traditional by Content Type</h2>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-brand-400">
              <span className="inline-block h-2 w-4 rounded bg-brand-500" /> AIO Score
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-gray-500">
              <span className="inline-block h-2 w-4 rounded bg-gray-600" /> Traditional
            </span>
          </div>
        </div>
        <ResponsiveContainer height={240} width="100%">
          <BarChart data={CONTENT_DATA}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
            <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#6b7280' }} />
            <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="aio" fill="#6366f1" name="AIO Score" radius={[4, 4, 0, 0]} />
            <Bar dataKey="traditional" fill="#374151" name="Traditional" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Citations Growth */}
      <Card className="p-6">
        <h2 className="mb-6 text-lg font-bold text-white">Monthly Citation Volume</h2>
        <ResponsiveContainer height={200} width="100%">
          <BarChart data={GROWTH_DATA}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="citations" fill="#10b981" name="Citations" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Scan history table */}
      {scanHistory.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-bold text-white">Recent Scan Activity</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Source', 'Engine', 'Score', 'Intent', 'Date'].map((h) => (
                    <th key={h} className="pb-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scanHistory.slice(0, 10).map((scan) => (
                  <tr key={scan.id} className="border-b border-gray-800/50">
                    <td className="py-3 max-w-[180px] truncate text-gray-300">{scan.source}</td>
                    <td className="py-3">
                      <Badge variant="brand">{scan.engine}</Badge>
                    </td>
                    <td className="py-3">
                      <span className={cn(
                        'font-bold',
                        scan.visibilityScore >= 80 ? 'text-emerald-400' :
                        scan.visibilityScore >= 50 ? 'text-brand-400' : 'text-red-400',
                      )}>
                        {scan.visibilityScore}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400">{scan.intent}</td>
                    <td className="py-3 text-gray-500 text-xs">{formatDate(scan.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
