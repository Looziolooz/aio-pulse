import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Variants ─────────────────────────────────────────────────────────────────

const buttonVariants = cva(
  // Base
  [
    'inline-flex items-center justify-center gap-2',
    'font-semibold rounded-xl',
    'transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.97]',
    'select-none',
  ].join(' '),
  {
    variants: {
      variant: {
        primary:
          'bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:bg-brand-500 hover:shadow-brand-500/30',
        secondary:
          'bg-white/10 text-white border border-white/10 hover:bg-white/15 hover:border-white/20',
        outline:
          'border border-gray-800 bg-transparent text-gray-200 hover:bg-gray-800/80 hover:text-white',
        ghost:
          'bg-transparent text-gray-400 hover:bg-gray-800/60 hover:text-white',
        danger:
          'bg-red-600/10 text-red-400 border border-red-600/20 hover:bg-red-600 hover:text-white',
        success:
          'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 hover:bg-emerald-600 hover:text-white',
        link:
          'h-auto p-0 text-brand-400 underline-offset-4 hover:underline hover:text-brand-300',
      },
      size: {
        xs:  'h-7  px-2.5 text-xs  gap-1',
        sm:  'h-8  px-3   text-sm  gap-1.5',
        md:  'h-10 px-4   text-sm  gap-2',
        lg:  'h-12 px-6   text-base gap-2',
        xl:  'h-14 px-8   text-lg  gap-3',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as child component (Radix Slot) */
  asChild?: boolean
  /** Show loading spinner and disable interaction */
  loading?: boolean
  /** Icon to render on the left */
  leftIcon?: React.ReactNode
  /** Icon to render on the right */
  rightIcon?: React.ReactNode
}

// ─── Component ────────────────────────────────────────────────────────────────

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled ?? loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
