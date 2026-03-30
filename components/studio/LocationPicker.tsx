'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
} from '@vis.gl/react-google-maps'
import { MapPin, Loader2, Search, Navigation } from 'lucide-react'
import type { MapMouseEvent } from '@vis.gl/react-google-maps'

const MANILA_CENTER = { lat: 14.5995, lng: 120.9842 }

interface Props {
  coordLat: number | null
  coordLng: number | null
  address: string
  onLocationChange: (lat: number | null, lng: number | null, address: string) => void
}

type Suggestion = { placeId: string; description: string }

function MapContent({
  coordLat,
  coordLng,
  onPick,
}: {
  coordLat: number | null
  coordLng: number | null
  onPick: (lat: number, lng: number) => void
}) {
  const map = useMap()

  // Pan + zoom to pin whenever coordinates are set externally (e.g. autocomplete selection)
  useEffect(() => {
    if (!map || coordLat == null || coordLng == null) return
    map.panTo({ lat: coordLat, lng: coordLng })
    map.setZoom(16)
  }, [map, coordLat, coordLng])

  const handleClick = useCallback(
    (e: MapMouseEvent) => {
      const { lat, lng } = e.detail.latLng ?? {}
      if (lat != null && lng != null) onPick(lat, lng)
    },
    [onPick]
  )

  return (
    <Map
      style={{ width: '100%', height: '100%' }}
      defaultCenter={MANILA_CENTER}
      defaultZoom={12}
      mapId="1bfa7673bcb65ded878640d4"
      gestureHandling="greedy"
      disableDefaultUI
      zoomControl
      fullscreenControl={false}
      streetViewControl={false}
      clickableIcons={false}
      onClick={handleClick}
    >
      {coordLat != null && coordLng != null && (
        <AdvancedMarker position={{ lat: coordLat, lng: coordLng }} zIndex={5}>
          <Pin background="#5c7a6b" borderColor="#3d5247" glyphColor="#ffffff" />
        </AdvancedMarker>
      )}
    </Map>
  )
}

export default function LocationPicker({ coordLat, coordLng, address, onLocationChange }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [fetching, setFetching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchSuggestions = async (input: string) => {
    if (!input.trim()) { setSuggestions([]); return }
    setFetching(true)
    try {
      const res = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(input)}`)
      const data: Suggestion[] = await res.json()
      setSuggestions(data)
      setShowDropdown(data.length > 0)
    } finally {
      setFetching(false)
    }
  }

  const handleAddressInput = (value: string) => {
    // Update address text only — don't touch the pin coordinates
    onLocationChange(coordLat, coordLng, value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 350)
  }

  const handleSelectSuggestion = async (s: Suggestion) => {
    setShowDropdown(false)
    setSuggestions([])
    setFetching(true)
    try {
      const res = await fetch(`/api/places/details?placeId=${s.placeId}`)
      const data = await res.json()
      onLocationChange(data.lat ?? null, data.lng ?? null, data.address || s.description)
    } catch {
      onLocationChange(null, null, s.description)
    } finally {
      setFetching(false)
    }
  }

  // Map tap: update pin position only — never overwrite the address text field
  const handleMapPick = useCallback((lat: number, lng: number) => {
    onLocationChange(lat, lng, address)
  }, [address, onLocationChange])

  const hasPinned = coordLat != null && coordLng != null

  return (
    <div className="space-y-3">
      {/* Address text input with autocomplete */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-text">Address</label>
        <div className="relative">
          <div className="relative flex items-center">
            <Search size={15} className="absolute left-3.5 text-muted pointer-events-none" />
            <input
              value={address}
              onChange={(e) => handleAddressInput(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="Search for an address…"
              className="w-full pl-9 pr-4 py-3 rounded-2xl border border-border bg-surface text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-sage/30 transition-all duration-200"
            />
            {fetching && (
              <Loader2 size={15} className="absolute right-3.5 text-muted animate-spin" />
            )}
          </div>

          {/* Autocomplete dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <ul className="absolute z-50 left-0 right-0 mt-1 bg-surface border border-border rounded-2xl shadow-lg overflow-hidden">
              {suggestions.map((s) => (
                <li
                  key={s.placeId}
                  onMouseDown={() => handleSelectSuggestion(s)}
                  className="flex items-start gap-2.5 px-4 py-3 text-sm text-text hover:bg-border/50 cursor-pointer transition-colors"
                >
                  <MapPin size={14} className="mt-0.5 flex-shrink-0 text-muted" />
                  {s.description}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pin status indicator */}
        <p className="text-xs text-muted flex items-center gap-1">
          {hasPinned ? (
            <><span className="w-2 h-2 rounded-full bg-sage inline-block" /> Location pinned</>
          ) : (
            <><span className="w-2 h-2 rounded-full bg-border inline-block" /> No pin yet — select a suggestion or tap the map</>
          )}
        </p>
      </div>

      {/* Map — always visible for manual pinning */}
      {apiKey && (
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text">
            Pin location
            <span className="ml-1.5 text-xs font-normal text-muted">(tap to place or adjust)</span>
          </label>
          <div className="relative h-52 rounded-2xl overflow-hidden border border-border">
            <APIProvider apiKey={apiKey}>
              <MapContent coordLat={coordLat} coordLng={coordLng} onPick={handleMapPick} />
            </APIProvider>

            {!hasPinned && (
              <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none">
                <span className="bg-surface/90 backdrop-blur-sm text-muted text-xs px-3 py-1.5 rounded-full border border-border">
                  Tap to drop a pin
                </span>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
