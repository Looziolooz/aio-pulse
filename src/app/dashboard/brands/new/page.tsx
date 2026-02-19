'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, ArrowLeft, Building2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'

const BRAND_COLORS = [
  '#6366f1', '#10b981', '#f97316', '#a855f7',
  '#3b82f6', '#ec4899', '#14b8a6', '#f59e0b',
  '#ef4444', '#84cc16',
]

const INDUSTRIES = [
  'Technology', 'SaaS / Software', 'E-commerce', 'Healthcare', 'Finance',
  'Marketing / Agency', 'Education', 'Media / Publishing', 'Consulting', 'Other',
]

export default function NewBrandPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    domain: '',
    industry: '',
    color: '#6366f1',
    aliasInput: '',
    aliases: [] as string[],
    competitorInput: '',
    competitors: [] as string[],
  })

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }))

  const addAlias = () => {
    const v = form.aliasInput.trim()
    if (v && !form.aliases.includes(v)) {
      setForm((f) => ({ ...f, aliases: [...f.aliases, v], aliasInput: '' }))
    }
  }

  const addCompetitor = () => {
    const v = form.competitorInput.trim()
    if (v && !form.competitors.includes(v)) {
      setForm((f) => ({ ...f, competitors: [...f.competitors, v], competitorInput: '' }))
    }
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Brand name is required'); return }
    setLoading(true)

    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          domain: form.domain.trim().replace(/^https?:\/\//, '') || undefined,
          industry: form.industry || undefined,
          color: form.color,
          aliases: form.aliases,
          competitors: form.competitors,
        }),
      })

      const json = await res.json() as { success: boolean; message?: string }
      if (!json.success) throw new Error(json.message)
      toast.success('Brand created!')
      router.push('/dashboard/brands')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create brand')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-in mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/brands">
          <Button size="sm" variant="ghost">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">New Brand</h1>
          <p className="mt-1 text-gray-400">Configure a brand to start AI monitoring.</p>
        </div>
      </div>

      {/* Preview */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black text-white"
            style={{ background: form.color, boxShadow: `0 4px 20px ${form.color}50` }}
          >
            {form.name.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-xl font-bold text-white">{form.name || 'Your Brand Name'}</p>
            <p className="text-sm text-gray-500">{form.domain || 'yourdomain.com'}</p>
            {form.industry && <p className="mt-1 text-xs text-gray-600">{form.industry}</p>}
          </div>
        </div>
      </Card>

      {/* Form */}
      <Card className="p-6 space-y-6">
        {/* Basic info */}
        <div className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">Basic Info</h2>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">
              Brand Name *
            </label>
            <input
              className="w-full rounded-xl border border-gray-800 bg-black/40 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="e.g. AIO Pulse"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">
              Description
            </label>
            <textarea
              className="w-full resize-none rounded-xl border border-gray-800 bg-black/40 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="Brief description of your brand..."
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">
                Primary Domain
              </label>
              <input
                className="w-full rounded-xl border border-gray-800 bg-black/40 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                placeholder="yourdomain.com"
                value={form.domain}
                onChange={(e) => set('domain', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">
                Industry
              </label>
              <select
                className="w-full rounded-xl border border-gray-800 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-brand-500"
                value={form.industry}
                onChange={(e) => set('industry', e.target.value)}
              >
                <option value="">Select industry...</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Color */}
        <div>
          <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-gray-500">Brand Color</h2>
          <div className="flex flex-wrap gap-2">
            {BRAND_COLORS.map((color) => (
              <button
                key={color}
                className={cn(
                  'h-9 w-9 rounded-xl transition-all',
                  form.color === color && 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110',
                )}
                style={{ background: color }}
                onClick={() => set('color', color)}
              />
            ))}
            <input
              className="h-9 w-9 cursor-pointer rounded-xl border-0 bg-transparent p-0"
              type="color"
              value={form.color}
              onChange={(e) => set('color', e.target.value)}
              title="Custom color"
            />
          </div>
        </div>

        {/* Aliases */}
        <div>
          <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-gray-500">
            Name Variants / Aliases
          </h2>
          <p className="mb-3 text-xs text-gray-500">
            Alternative spellings or abbreviations that AI might use to refer to your brand.
          </p>
          <div className="mb-3 flex gap-2">
            <input
              className="flex-1 rounded-xl border border-gray-800 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-500"
              placeholder="e.g. AIO-Pulse, aiopulse"
              value={form.aliasInput}
              onChange={(e) => set('aliasInput', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addAlias()}
            />
            <Button size="sm" variant="outline" onClick={addAlias}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.aliases.map((a) => (
              <span key={a} className="flex items-center gap-1.5 rounded-lg border border-gray-800 bg-gray-900/50 px-2.5 py-1 text-xs text-gray-300">
                {a}
                <button onClick={() => setForm((f) => ({ ...f, aliases: f.aliases.filter((x) => x !== a) }))}>
                  <X className="h-3 w-3 text-gray-600 hover:text-red-400" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Competitors */}
        <div>
          <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-gray-500">
            Competitors to Track
          </h2>
          <p className="mb-3 text-xs text-gray-500">
            Monitor when competitors are mentioned alongside your brand in AI responses.
          </p>
          <div className="mb-3 flex gap-2">
            <input
              className="flex-1 rounded-xl border border-gray-800 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-500"
              placeholder="e.g. GetCito, BrandMentions"
              value={form.competitorInput}
              onChange={(e) => set('competitorInput', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
            />
            <Button size="sm" variant="outline" onClick={addCompetitor}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.competitors.map((c) => (
              <span key={c} className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-400">
                {c}
                <button onClick={() => setForm((f) => ({ ...f, competitors: f.competitors.filter((x) => x !== c) }))}>
                  <X className="h-3 w-3 opacity-60 hover:opacity-100" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-800 pt-5">
          <Link href="/dashboard/brands">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button loading={loading} size="lg" onClick={handleSubmit}>
            <Building2 className="h-5 w-5" />
            Create Brand
          </Button>
        </div>
      </Card>
    </div>
  )
}
