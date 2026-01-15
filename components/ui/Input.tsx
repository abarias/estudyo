'use client'

import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-text">{label}</label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-3 rounded-2xl border border-border bg-surface text-text 
            placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-sage/30 
            transition-all duration-200 ${className}`}
          {...props}
        />
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
