'use client'

import { Info, X } from 'lucide-react'
import { useState } from 'react'

interface BannerProps {
  message: string
  dismissible?: boolean
  variant?: 'info' | 'warning'
}

export default function Banner({ message, dismissible = true, variant = 'info' }: BannerProps) {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  const bgColor = variant === 'info' ? 'bg-sky/20' : 'bg-clay/20'
  const textColor = variant === 'info' ? 'text-sky' : 'text-clay'

  return (
    <div className={`${bgColor} px-4 py-2 flex items-center justify-between`}>
      <div className="flex items-center gap-2">
        <Info size={14} className={textColor} />
        <span className={`text-xs font-medium ${textColor}`}>{message}</span>
      </div>
      {dismissible && (
        <button onClick={() => setVisible(false)} className={`${textColor} p-1`}>
          <X size={14} />
        </button>
      )}
    </div>
  )
}
