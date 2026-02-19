'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FileSearch, Globe, BarChart3, GitCompare,
  Clock, Building2, MessageSquare, Shield, Smile, Bell, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    ],
  },
  {
    label: 'Content Tools',
    items: [
      { href: '/dashboard/optimizer', icon: FileSearch, label: 'Content Optimizer' },
      { href: '/dashboard/monitor', icon: Globe, label: 'Engine Monitor' },
      { href: '/dashboard/competitor', icon: GitCompare, label: 'Competitor Analysis' },
      { href: '/dashboard/history', icon: Clock, label: 'Scan History' },
    ],
  },
  {
    label: 'Brand Monitoring',
    items: [
      { href: '/dashboard/brands', icon: Building2, label: 'Brands' },
      { href: '/dashboard/prompts', icon: MessageSquare, label: 'Prompts' },
      { href: '/dashboard/monitoring', icon: Shield, label: 'Results' },
      { href: '/dashboard/sentiment', icon: Smile, label: 'Sentiment' },
      { href: '/dashboard/alerts', icon: Bell, label: 'Alerts' },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-800 bg-[#080d18] transition-transform duration-300',
        'lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-800 px-5">
          <Link className="flex items-center gap-2.5" href="/dashboard">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 shadow-lg shadow-brand-600/30">
              <span className="text-sm font-black text-white">A</span>
            </div>
            <span className="text-base font-black tracking-tight text-white">AIO Pulse</span>
          </Link>
          <button
            className="rounded-lg p-1.5 text-gray-600 hover:text-gray-300 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-6">
              <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-widest text-gray-600">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',
                        active
                          ? 'bg-brand-500/15 text-brand-300'
                          : 'text-gray-500 hover:bg-gray-800/60 hover:text-gray-200',
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className={cn('h-4 w-4 shrink-0', active ? 'text-brand-400' : 'text-gray-600')} />
                      {item.label}
                      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-gray-900/60 px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600/20 text-xs font-black text-brand-400">
              U
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-gray-300">Dev User</p>
              <p className="truncate text-[10px] text-gray-600">dev-user-local</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
