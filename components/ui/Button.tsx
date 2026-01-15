'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', fullWidth = false, className = '', children, ...props }, ref) => {
    const base = 'px-4 py-3 rounded-2xl font-medium transition-all duration-200 disabled:opacity-50'
    const variants: Record<ButtonVariant, string> = {
      primary: 'bg-sage text-white hover:opacity-90',
      secondary: 'bg-surface border border-border text-text hover:bg-bg',
      ghost: 'bg-transparent text-muted hover:text-text hover:bg-bg',
    }
    const width = fullWidth ? 'w-full' : ''

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${width} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
