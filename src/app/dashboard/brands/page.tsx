'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Plus,
  Building2,
  Globe,
  Tag,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils' // Fix: Importato cn correttamente
import toast from 'react-hot-toast'
import type { Brand } from '@/types'

function BrandCard({ brand, onDelete }: { brand: Brand; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Eliminare il brand "${brand.name}"? Verranno rimossi anche tutti i dati di monitoraggio.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/brands/${brand.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Errore server: ${res.status}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      onDelete(brand.id)
      toast.success(`"${brand.name}" eliminato`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Eliminazione fallita')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card className="group p-6 transition-all hover:border-gray-700">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-black text-white shadow-lg"
            style={{ background: brand.color, boxShadow: `0 4px 16px ${brand.color}40` }}
          >
            {brand.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-bold text-white">{brand.name}</h3>
            {brand.domain && (
              <a
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
                href={`https://${brand.domain}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Globe className="h-3 w-3" />
                <span className="truncate">{brand.domain}</span>
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <Link href={`/dashboard/brands/${brand.id}`}>
            <Button size="icon" variant="ghost">
              <Edit3 className="h-4 w-4" />
            </Button>
          </Link>
          <Button loading={deleting} size="icon" variant="ghost" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 text-red-400" />
          </Button>
        </div>
      </div>

      {brand.description && (
        <p className="mb-4 line-clamp-2 text-sm text-gray-400">{brand.description}</p>
      )}

      <div className="space-y-2.5">
        {brand.industry && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Tag className="h-3.5 w-3.5" />
            {brand.industry}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {brand.aliases?.slice(0, 3).map((a) => (
            <span key={a} className="rounded-md border border-gray-800 bg-gray-900/50 px-2 py-0.5 text-[10px] text-gray-400">
              {a}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-gray-800 pt-4">
        <div className="flex items-center gap-1.5">
          {brand.is_active ? (
            <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /><span className="text-xs text-emerald-400">Attivo</span></>
          ) : (
            <><XCircle className="h-3.5 w-3.5 text-gray-600" /><span className="text-xs text-gray-600">Pausa</span></>
          )}
        </div>
        <Link href={`/dashboard/prompts?brand_id=${brand.id}`}>
          <Button size="sm" variant="outline">Prompt</Button>
        </Link>
      </div>
    </Card>
  )
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadBrands = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/brands')
      
      const text = await res.text()
      let json
      try {
        json = JSON.parse(text)
      } catch { // Fix: Rimosso 'e' non utilizzato
        throw new Error(`Risposta non valida (500). Controlla le chiavi API su Vercel.`)
      }

      if (!res.ok || !json.success) {
        throw new Error(json.message || `Errore server (${res.status})`)
      }

      setBrands(json.data ?? [])
    } catch (err) {
      console.error('[BrandsPage] Load error:', err)
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dei brand')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadBrands() }, [loadBrands])

  return (
    <div className="animate-in space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">I tuoi Brand</h1>
          <p className="mt-1 text-gray-400">Gestisci i brand monitorati nei motori AI.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="lg" onClick={loadBrands} disabled={loading}>
            <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} />
          </Button>
          <Link href="/dashboard/brands/new" className="flex-1 sm:flex-none">
            <Button size="lg" className="w-full">
              <Plus className="h-5 w-5" /> Nuovo Brand
            </Button>
          </Link>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-400">
          <AlertCircle className="h-10 w-10" />
          <div>
            <p className="font-bold">Si è verificato un errore</p>
            <p className="text-sm opacity-80">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadBrands}>Riprova</Button>
        </div>
      )}

      {!loading && !error && brands.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Building2 className="mb-6 h-16 w-16 text-gray-800" />
          <h2 className="mb-2 text-xl font-bold text-white">Nessun brand trovato</h2>
          <p className="mb-8 max-w-sm text-gray-500">Crea il tuo primo brand per iniziare il monitoraggio della visibilità.</p>
          <Link href="/dashboard/brands/new">
            <Button size="lg"><Plus className="h-5 w-5" /> Crea il primo brand</Button>
          </Link>
        </div>
      )}

      {!loading && brands.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {brands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} onDelete={(id) => setBrands(b => b.filter(x => x.id !== id))} />
          ))}
        </div>
      )}
    </div>
  )
}