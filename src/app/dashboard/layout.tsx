import type { Metadata } from 'next'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'

export const metadata: Metadata = {
  title: 'Dashboard',
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-950">
      {/* Sidebar - Posizionamento fisso gestito internamente */}
      <Sidebar />
      
      {/* Contenitore principale: 
          - lg:pl-64 aggiunge spazio a sinistra su desktop per la sidebar (w-64)
      */}
      <div className="flex flex-1 flex-col overflow-hidden lg:pl-64">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
          {/* Limitiamo la larghezza massima per mantenere i grafici leggibili su schermi ultra-wide */}
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}