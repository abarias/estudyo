'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ active = false, className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
          ${active 
            ? 'bg-sage text-white' 
            : 'bg-surface border border-border text-muted hover:text-text'
          } ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Chip.displayName = 'Chip'
export default Chip
