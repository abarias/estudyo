'use client'

import { useMemo } from 'react'
import { addDays, format, isToday } from 'date-fns'

interface DateStripProps {
  selectedDate: Date
  onSelectDate: (date: Date) => void
}

export default function DateStrip({ selectedDate, onSelectDate }: DateStripProps) {
  const dates = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return Array.from({ length: 6 }, (_, i) => addDays(today, i))
  }, [])

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2 px-4 -mx-4">
      {dates.map((date) => {
        const isSelected = date.toDateString() === selectedDate.toDateString()
        return (
          <button
            key={date.toISOString()}
            onClick={() => onSelectDate(date)}
            className={`flex flex-col items-center min-w-[56px] py-2 px-3 rounded-2xl transition-all
              ${isSelected 
                ? 'bg-sage text-white' 
                : 'bg-surface border border-border text-muted hover:text-text'
              }`}
          >
            <span className="text-xs font-medium">
              {isToday(date) ? 'Today' : format(date, 'EEE')}
            </span>
            <span className="text-lg font-semibold">{format(date, 'd')}</span>
          </button>
        )
      })}
    </div>
  )
}
