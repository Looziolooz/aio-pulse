'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Plus, Building2, Globe, Tag, Trash2, Edit3,
  CheckCircle2, XCircle, AlertCircle, Loader2,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/index'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Brand } from '@/types'

function BrandCard({ brand, onDelete }: { brand: Brand; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Delete brand "${brand.name}"? This will remove all associated prompts and monitoring data.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/brands/${brand.id}`, { method: 'DELETE' })
      const json = await res.json() as { success: boolean; message?: string }
      if (!json.success) throw new Error(json.message)
      onDelete(brand.id)
      toast.success(`"${brand.name}" deleted`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
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
          <div>
            <h3 className="font-bold text-white">{brand.name}</h3>
            {brand.domain && (
              <a
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
                href={`https://${brand.domain}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Globe className="h-3 w-3" /> {brand.domain}
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
        {brand.aliases.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {brand.aliases.slice(0, 3).map((a) => (
              <span key={a} className="rounded-md border border-gray-800 bg-gray-900/50 px-2 py-0.5 text-[10px] text-gray-400">
                {a}
              </span>
            ))}
            {brand.aliases.length > 3 && (
              <span className="text-[10px] text-gray-600">+{brand.aliases.length - 3} more</span>
            )}
          </div>
        )}
        {brand.competitors.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Building2 className="h-3.5 w-3.5" />
            Tracking {brand.competitors.length} competitor{brand.competitors.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-gray-800 pt-4">
        <div className="flex items-center gap-1.5">
          {brand.is_active
            ? <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /><span className="text-xs text-emerald-400">Active</span></>
            : <><XCircle className="h-3.5 w-3.5 text-gray-600" /><span className="text-xs text-gray-600">Paused</span></>
          }
        </div>
        <Link href={`/dashboard/prompts?brand_id=${brand.id}`}>
          <Button size="sm" variant="outline">View Prompts</Button>
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
    try {
      const res = await fetch('/api/brands')
      const json = await res.json() as { success: boolean; data?: Brand[]; message?: string }
      if (!json.success) throw new Error(json.message)
      setBrands(json.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load brands')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadBrands() }, [loadBrands])

  const handleDelete = (id: string) => setBrands((prev) => prev.filter((b) => b.id !== id))

  return (
    <div className="animate-in space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Brands</h1>
          <p className="mt-1 text-gray-400">Manage the brands you're monitoring across AI search engines.</p>
        </div>
        <Link href="/dashboard/brands/new">
          <Button size="lg">
            <Plus className="h-5 w-5" /> New Brand
          </Button>
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {!loading && !error && brands.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-gray-800 bg-gray-900">
            <Building2 className="h-10 w-10 text-gray-700" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-white">No brands yet</h2>
          <p className="mb-8 max-w-sm text-gray-500">
            Create your first brand to start monitoring its visibility across AI search engines.
          </p>
          <Link href="/dashboard/brands/new">
            <Button size="lg">
              <Plus className="h-5 w-5" /> Create your first brand
            </Button>
          </Link>
        </div>
      )}

      {!loading && brands.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {brands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
