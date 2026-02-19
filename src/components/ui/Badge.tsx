import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest',
  {
    variants: {
      variant: {
        default: 'bg-gray-800 text-gray-300',
        brand: 'bg-brand-500/15 text-brand-400 border border-brand-500/20',
        success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
        warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
        danger: 'bg-red-500/15 text-red-400 border border-red-500/20',
        info: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
        purple: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
        outline: 'border border-current bg-transparent',
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

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, dot = false, children, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  ),
)
Badge.displayName = 'Badge'

export { Badge, badgeVariants }
