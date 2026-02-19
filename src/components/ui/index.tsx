import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Badge ────────────────────────────────────────────────────────────────────

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest',
  {
    variants: {
      variant: {
        default:  'bg-gray-800 text-gray-300',
        brand:    'bg-brand-500/15 text-brand-400 border border-brand-500/20',
        success:  'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
        warning:  'bg-amber-500/15 text-amber-400 border border-amber-500/20',
        danger:   'bg-red-500/15 text-red-400 border border-red-500/20',
        info:     'bg-blue-500/15 text-blue-400 border border-blue-500/20',
        purple:   'bg-purple-500/15 text-purple-400 border border-purple-500/20',
        outline:  'border border-current bg-transparent',
      },
      size: {
        sm: 'text-[9px] px-1.5 py-0',
        md: 'text-[10px] px-2 py-0.5',
        lg: 'text-xs px-3 py-1',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

const Badge: React.FC<BadgeProps> = ({ className, variant, size, dot = false, children, ...props }) => (
  <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
    {dot && (
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
    )}
    {children}
  </span>
)

// ─── Spinner ──────────────────────────────────────────────────────────────────

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }
  return (
    <Loader2 className={cn('animate-spin text-brand-400', sizes[size], className)} />
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftElement?: React.ReactNode
  rightElement?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftElement, rightElement, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            className="block text-xs font-bold uppercase tracking-widest text-gray-400"
            htmlFor={inputId}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftElement && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {leftElement}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-xl border bg-black/40 px-4 py-3 text-sm text-white placeholder-gray-600',
              'outline-none transition-all',
              'focus:border-brand-500 focus:ring-1 focus:ring-brand-500',
              error
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-800',
              leftElement && 'pl-10',
              rightElement && 'pr-10',
              className,
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            className="block text-xs font-bold uppercase tracking-widest text-gray-400"
            htmlFor={inputId}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border bg-black/40 px-4 py-3 text-sm text-white placeholder-gray-600',
            'outline-none transition-all resize-none font-mono',
            'focus:border-brand-500 focus:ring-1 focus:ring-brand-500',
            error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-800',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            className="block text-xs font-bold uppercase tracking-widest text-gray-400"
            htmlFor={inputId}
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'w-full appearance-none rounded-xl border border-gray-800 bg-black/40 px-4 py-3 text-sm text-white',
            'outline-none transition-all',
            'focus:border-brand-500 focus:ring-1 focus:ring-brand-500',
            error && 'border-red-500/50',
            className,
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} disabled={opt.disabled} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  },
)
Select.displayName = 'Select'

// ─── Exports ──────────────────────────────────────────────────────────────────

export { Badge, badgeVariants, Spinner, Input, Textarea, Select }
