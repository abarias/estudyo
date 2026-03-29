'use client'

// Plain address input — coordinates are resolved server-side via Geocoding API on save.
// Autocomplete can be re-enabled here in the future once API key restrictions are configured.

interface Props {
  label?: string
  value: string
  onChange: (address: string) => void
  // kept in the interface so callers don't need to change
  onPlaceSelect?: (address: string, lat: number, lng: number) => void
  placeholder?: string
}

export default function AddressInput({ label, value, onChange, placeholder }: Props) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-text">{label}</label>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? '123 Main St, City'}
        className="w-full px-4 py-3 rounded-2xl border border-border bg-surface text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-sage/30 transition-all duration-200"
      />
    </div>
  )
}
