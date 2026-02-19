'use client'

import Link from 'next/link'
import { Globe, Zap, ShieldCheck, Activity, ArrowRight, FileSearch, GitCompare, Clock } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const GROWTH_DATA = [
  { month: 'Sep', visibility: 52, citations: 320 },
  { month: 'Oct', visibility: 58, citations: 440 },
  { month: 'Nov', visibility: 61, citations: 520 },
  { month: 'Dec', visibility: 67, citations: 680 },
  { month: 'Jan', visibility: 74, citations: 890 },
  { month: 'Feb', visibility: 84, citations: 1240 },
]

const ENGINE_STATS = [
  { name: 'ChatGPT', score: 89, color: '#10b981' },
  { name: 'Gemini', score: 74, color: '#3b82f6' },
  { name: 'Perplexity', score: 82, color: '#a855f7' },
  { name: 'Claude', score: 91, color: '#f97316' },
]

const QUICK_ACTIONS = [
  { label: 'Analyze Content', href: '/dashboard/optimizer', icon: FileSearch, desc: 'Run a new AIO audit' },
  { label: 'Compare Competitors', href: '/dashboard/competitor', icon: GitCompare, desc: 'Benchmark vs rivals' },
  { label: 'View History', href: '/dashboard/history', icon: Clock, desc: 'Browse past scans' },
]

export default function DashboardPage() {
  const scanHistory = useAppStore((s) => s.scanHistory)
  const scanCount = scanHistory.length

  const avgScore = scanCount > 0
    ? Math.round(scanHistory.reduce((a, s) => a + s.visibilityScore, 0) / scanCount)
    : 84

  const stats = [
    { title: 'AI Visibility', value: `${avgScore}%`, change: 12, icon: Globe, accent: 'text-brand-400', bg: 'bg-brand-500/10' },
    { title: 'Scans Run', value: scanCount || '0', change: scanCount, icon: Zap, accent: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'AEO Authority', value: '91/100', change: 5, icon: ShieldCheck, accent: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'Avg. Position', value: '#2.4', change: -0.3, icon: Activity, accent: 'text-purple-400', bg: 'bg-purple-500/10' },
  ]

  return (
    <div className="animate-in space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-white">Overview</h1>
        <p className="text-gray-400">Your AI search visibility performance at a glance.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className={`${stat.bg} rounded-lg p-2.5`}>
                <stat.icon className={`h-5 w-5 ${stat.accent}`} />
              </div>
              <Badge variant={stat.change >= 0 ? 'success' : 'danger'}>
                {stat.change > 0 ? '+' : ''}{stat.change}{typeof stat.change === 'number' && Math.abs(stat.change) < 10 ? '%' : ''}
              </Badge>
            </div>
            <p className="text-sm font-medium text-gray-400">{stat.title}</p>
            <p className="mt-1 text-2xl font-black text-white">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Chart + Engine */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Visibility Growth</h2>
            <Link href="/dashboard/analytics">
              <Button size="sm" variant="ghost">
                Full analytics <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <ResponsiveContainer height={240} width="100%">
            <LineChart data={GROWTH_DATA}>
              <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Line dataKey="visibility" dot={false} name="AI Visibility" stroke="#6366f1" strokeWidth={2.5} type="monotone" />
              <Line dataKey="citations" dot={false} name="Citations" stroke="#10b981" strokeWidth={2} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h2 className="mb-6 text-lg font-bold text-white">Engine Scores</h2>
          <div className="space-y-5">
            {ENGINE_STATS.map((engine) => (
              <div key={engine.name}>
                <div className="mb-1.5 flex justify-between text-sm font-medium">
                  <span className="text-gray-300">{engine.name}</span>
                  <span className="font-bold text-white">{engine.score}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${engine.score}%`, backgroundColor: engine.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Recent scans */}
          {scanCount > 0 && (
            <div className="mt-6 border-t border-gray-800 pt-5">
              <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Recent Scans</p>
              <div className="space-y-2">
                {scanHistory.slice(0, 3).map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/40 px-3 py-2">
                    <p className="max-w-[120px] truncate text-xs text-gray-300">{s.source}</p>
                    <span className={cn(
                      'text-xs font-bold',
                      s.visibilityScore >= 80 ? 'text-emerald-400' : s.visibilityScore >= 50 ? 'text-brand-400' : 'text-red-400',
                    )}>{s.visibilityScore}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-white">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="group p-5 cursor-pointer transition-all hover:border-brand-500/30 hover:bg-brand-500/5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-800 bg-gray-900 transition-colors group-hover:border-brand-500/30 group-hover:bg-brand-500/10">
                  <action.icon className="h-5 w-5 text-gray-400 group-hover:text-brand-400" />
                </div>
                <p className="font-bold text-white">{action.label}</p>
                <p className="mt-0.5 text-xs text-gray-500">{action.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-gray-600 transition-colors group-hover:text-brand-400">
                  Go <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
