import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { generateId } from '@/lib/utils'
import type { AnalysisResult, ScanHistoryEntry, EngineId, ModelId } from '@/types'

// ─── State Shape ──────────────────────────────────────────────────────────────

interface AppStore {
  // ── Share stats ───────────────────────────────────────────────────────────
  shareStats: { copies: number; shares: number }
  incrementCopies: () => void
  incrementShares: () => void

  // ── Scan history ──────────────────────────────────────────────────────────
  scanHistory: ScanHistoryEntry[]
  addScan: (result: AnalysisResult, engine: EngineId, model: ModelId) => ScanHistoryEntry
  removeScan: (id: string) => void
  clearHistory: () => void

  // ── UI state ──────────────────────────────────────────────────────────────
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>()(
  devtools(
    (set) => ({
      // Share stats
      shareStats: { copies: 0, shares: 0 },
      incrementCopies: () =>
        set((s) => ({ shareStats: { ...s.shareStats, copies: s.shareStats.copies + 1 } })),
      incrementShares: () =>
        set((s) => ({ shareStats: { ...s.shareStats, shares: s.shareStats.shares + 1 } })),

      // Scan history
      scanHistory: [],
      addScan: (result, engine, model) => {
        const entry: ScanHistoryEntry = {
          ...result,
          id: generateId('scan'),
          engine,
          model,
          timestamp: Date.now(),
        }
        set((s) => ({
          scanHistory: [entry, ...s.scanHistory].slice(0, 50),
        }))
        return entry
      },
      removeScan: (id) =>
        set((s) => ({ scanHistory: s.scanHistory.filter((e) => e.id !== id) })),
      clearHistory: () => set({ scanHistory: [] }),

      // UI
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    { name: 'AIOPulseStore' },
  ),
)

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectScanHistory = (s: AppStore) => s.scanHistory
export const selectShareStats  = (s: AppStore) => s.shareStats
export const selectSidebarOpen = (s: AppStore) => s.sidebarOpen
