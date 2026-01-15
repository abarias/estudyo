interface DividerProps {
  label?: string
  className?: string
}

export default function Divider({ label, className = '' }: DividerProps) {
  if (label) {
    return (
      <div className={`relative my-4 ${className}`}>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-surface text-sm text-muted">{label}</span>
        </div>
      </div>
    )
  }

  return <div className={`border-t border-border my-4 ${className}`} />
}
