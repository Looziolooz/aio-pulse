import type { Metadata } from 'next'
import Link from 'next/link'
import { Shield } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'

export const metadata: Metadata = { title: 'Sign In' }

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-950 px-6">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-30" />
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/15 blur-3xl" />

      <div className="animate-in relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 shadow-xl shadow-brand-600/30">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">{APP_NAME}</h1>
            <p className="mt-1 text-sm text-gray-400">Sign in to your account</p>
          </div>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          <form className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">
                Email
              </label>
              <input
                required
                autoComplete="email"
                className="w-full rounded-xl border border-gray-800 bg-black/40 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                placeholder="you@company.com"
                type="email"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">
                Password
              </label>
              <input
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-gray-800 bg-black/40 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                placeholder="••••••••"
                type="password"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-400">
                <input className="rounded" type="checkbox" />
                Remember me
              </label>
              <Link className="text-brand-400 transition-colors hover:text-brand-300" href="#">
                Forgot password?
              </Link>
            </div>

            <button
              className="w-full rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition-all hover:bg-brand-500 active:scale-95"
              type="submit"
            >
              Sign In
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link className="font-semibold text-brand-400 hover:text-brand-300" href="#">
              Create one
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          By signing in, you agree to our{' '}
          <Link className="underline hover:text-gray-400" href="#">Terms</Link> and{' '}
          <Link className="underline hover:text-gray-400" href="#">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
