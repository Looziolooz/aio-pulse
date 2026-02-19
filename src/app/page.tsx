import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Shield, Zap, BarChart3, Globe, CheckCircle2, Sparkles } from 'lucide-react'
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'AI Search Visibility Platform',
  description: APP_DESCRIPTION,
}

const features = [
  {
    icon: Sparkles,
    title: 'Content Optimizer',
    description: 'Deep AIO audits with intent mapping, keyword density analysis, and engine-specific recommendations.',
    accent: 'text-brand-400',
    bg: 'bg-brand-500/10',
    border: 'border-brand-500/20',
  },
  {
    icon: BarChart3,
    title: 'Competitor Analysis',
    description: 'Benchmark your visibility against up to 3 competitors across all major AI search engines.',
    accent: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    icon: Globe,
    title: 'Engine Monitor',
    description: 'Real-time surveillance of ChatGPT, Gemini, Perplexity, and Claude indexing patterns.',
    accent: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  {
    icon: Zap,
    title: 'Analytics Dashboard',
    description: 'Cross-platform metrics showing AI search vs. traditional search visibility convergence.',
    accent: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
]

const stats = [
  { value: '4+', label: 'AI Engines Monitored' },
  { value: '50+', label: 'Metrics Tracked' },
  { value: '99%', label: 'Analysis Accuracy' },
  { value: '<2s', label: 'Average Audit Time' },
]

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-950">
      {/* Background grid */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-40" />
      {/* Gradient orbs */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-purple-600/10 blur-3xl" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-lg shadow-brand-600/30">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">{APP_NAME}</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-gray-400 md:flex">
            <Link className="transition-colors hover:text-white" href="#features">Features</Link>
            <Link className="transition-colors hover:text-white" href="#stats">Stats</Link>
            <Link className="transition-colors hover:text-white" href="/dashboard">Dashboard</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-white"
              href="/auth/login"
            >
              Sign in
            </Link>
            <Link
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-all hover:bg-brand-500 hover:shadow-brand-500/30 active:scale-95"
              href="/dashboard"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 pb-24 pt-32 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-400">
            <Sparkles className="h-3 w-3" />
            AI Search Visibility Platform
          </div>

          <h1 className="balance mb-6 text-5xl font-black tracking-tight text-white md:text-7xl">
            Dominate Every{' '}
            <span className="text-gradient">AI Search</span>{' '}
            Engine
          </h1>

          <p className="pretty mx-auto mb-10 max-w-2xl text-lg text-gray-400">
            Monitor, optimize, and dominate your visibility across ChatGPT, Gemini, Perplexity, and
            Claude — with enterprise-grade AIO, AEO, and GEO intelligence.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              className="flex items-center gap-2 rounded-2xl bg-brand-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-brand-600/25 transition-all hover:bg-brand-500 hover:shadow-brand-500/30 active:scale-95"
              href="/dashboard"
            >
              <Zap className="h-5 w-5" />
              Launch Dashboard
            </Link>
            <Link
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
              href="#features"
            >
              See Features <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-white/5 bg-white/[0.02] px-6 py-16" id="stats">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl font-black tracking-tight text-white">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 py-24" id="features">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-black tracking-tight text-white">
              Everything you need to win{' '}
              <span className="text-gradient">AI search</span>
            </h2>
            <p className="mx-auto max-w-xl text-gray-400">
              A complete platform for monitoring and optimizing your digital presence across all
              generative AI search engines.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border bg-white/[0.03] p-8 transition-all hover:bg-white/[0.05]',
                  feature.border,
                )}
              >
                <div
                  className={cn(
                    'mb-6 flex h-12 w-12 items-center justify-center rounded-xl border',
                    feature.bg,
                    feature.border,
                  )}
                >
                  <feature.icon className={cn('h-6 w-6', feature.accent)} />
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">{feature.title}</h3>
                <p className="leading-relaxed text-gray-400">{feature.description}</p>

                <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-gray-500 transition-colors group-hover:text-gray-300">
                  Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-3xl rounded-3xl border border-brand-500/20 bg-brand-600/10 p-12 text-center">
          <h2 className="mb-4 text-4xl font-black tracking-tight text-white">
            Ready to dominate AI search?
          </h2>
          <p className="mb-8 text-gray-400">
            Start your free audit today — no credit card required.
          </p>
          <Link
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-8 py-4 font-bold text-white shadow-xl shadow-brand-600/25 transition-all hover:bg-brand-500 active:scale-95"
            href="/dashboard"
          >
            <Shield className="h-5 w-5" />
            Open Platform
          </Link>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
            {['No credit card', 'Instant access', 'Cancel anytime'].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-sm text-gray-600">
          <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link className="transition-colors hover:text-gray-400" href="#">Privacy</Link>
            <Link className="transition-colors hover:text-gray-400" href="#">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
