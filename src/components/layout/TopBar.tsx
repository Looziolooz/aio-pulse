'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Bell, User, Search, Menu } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/lib/store'

export function TopBar() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-800 bg-surface-950/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Hamburger — visibile solo su mobile (< lg) */}
        <Button
          size="icon"
          variant="ghost"
          className="lg:hidden"
          onClick={toggleSidebar}
          aria-label="Apri menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search — nascosto su mobile */}
        <div className="relative hidden max-w-xs flex-1 md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            className="w-full rounded-xl border border-gray-800 bg-gray-900 py-2 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-600 outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            placeholder="Search resources..."
            type="text"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications */}
        <Button size="icon" variant="ghost" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-500" />
          <span className="sr-only">Notifications</span>
        </Button>

        <div className="h-6 w-px bg-gray-800" />

        {/* Settings */}
        <Button size="sm" variant="outline">
          <User className="h-4 w-4" />
          Settings
        </Button>
      </div>
    </header>
  )
}