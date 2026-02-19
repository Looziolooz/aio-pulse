import * as React from 'react'
import { cn } from '@/lib/utils'

// ─── Root ─────────────────────────────────────────────────────────────────────

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Remove default padding */
  noPadding?: boolean
  /** Add hover border highlight */
  interactive?: boolean
  /** Add a brand glow on hover */
  glow?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, glow = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900',
        interactive && 'transition-colors hover:border-gray-700 cursor-pointer',
        glow && 'hover:shadow-glow hover:shadow-brand-500/20',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
)
Card.displayName = 'Card'

// ─── Header ───────────────────────────────────────────────────────────────────

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  action?: React.ReactNode
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, description, action, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-start justify-between gap-4 px-6 pt-6', className)}
      {...props}
    >
      {(title ?? description ?? children) && (
        <div className="flex-1">
          {title && <h3 className="text-lg font-bold text-white">{title}</h3>}
          {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
          {children}
        </div>
      )}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  ),
)
CardHeader.displayName = 'CardHeader'

// ─── Body ─────────────────────────────────────────────────────────────────────

const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 py-6', className)} {...props} />
  ),
)
CardBody.displayName = 'CardBody'

// ─── Footer ───────────────────────────────────────────────────────────────────

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center border-t border-gray-800 px-6 py-4', className)}
      {...props}
    />
  ),
)
CardFooter.displayName = 'CardFooter'

// ─── Divider ──────────────────────────────────────────────────────────────────

const CardDivider: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('border-t border-gray-800', className)} />
)

export { Card, CardHeader, CardBody, CardFooter, CardDivider }
