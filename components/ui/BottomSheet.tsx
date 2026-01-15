'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { X } from 'lucide-react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const [closing, setClosing] = useState(false)
  const [dragY, setDragY] = useState(0)
  const dragStartY = useRef(0)
  const isDragging = useRef(false)

  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(() => {
      setClosing(false)
      setDragY(0)
      onClose()
    }, 200)
  }, [onClose])

  // Prevent background scroll when open
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
      
      return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [open])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !closing) {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, closing, handleClose])

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === backdropRef.current && !closing) {
      handleClose()
    }
  }, [closing, handleClose])

  // Drag to close handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    // Only allow drag from handle area
    if (target.closest('[data-drag-handle]')) {
      dragStartY.current = e.touches[0].clientY
      isDragging.current = true
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return
    const currentY = e.touches[0].clientY
    const delta = currentY - dragStartY.current
    if (delta > 0) {
      setDragY(delta)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    if (dragY > 100) {
      handleClose()
    } else {
      setDragY(0)
    }
  }, [dragY, handleClose])

  if (!open && !closing) return null

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop with fade transition */}
      <div 
        ref={backdropRef}
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      {/* Sheet with slide-up transition */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sheet-title' : undefined}
        className={`absolute bottom-0 left-0 right-0 bg-surface rounded-t-3xl max-h-[85vh] flex flex-col ${closing ? 'animate-slide-down' : 'animate-slide-up'}`}
        style={{ transform: dragY > 0 ? `translateY(${dragY}px)` : undefined }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle bar - draggable */}
        <div className="flex-shrink-0 pt-3 pb-2 px-4" data-drag-handle>
          <div className="w-10 h-1 bg-border rounded-full mx-auto mb-3 cursor-grab" />
          <div className="flex items-center justify-between">
            {title && (
              <h2 id="sheet-title" className="text-lg font-semibold text-text">
                {title}
              </h2>
            )}
            <button
              onClick={handleClose}
              className="p-2 -mr-2 text-muted hover:text-text transition-colors rounded-full hover:bg-bg ml-auto"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8">
          {children}
        </div>
      </div>
    </div>
  )
}
