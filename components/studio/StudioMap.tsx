'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps'
import type { Studio } from '@/types/domain'

// Default center: Metro Manila
const MANILA_CENTER = { lat: 14.5995, lng: 120.9842 }
const DEFAULT_ZOOM = 12

interface Props {
  studios: Studio[]
}

// Inner component — has access to the map instance via useMap()
function MapContent({ studios }: Props) {
  const router = useRouter()
  const map = useMap()
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedStudio, setSelectedStudio] = useState<Studio | null>(null)
  const locationFetched = useRef(false)

  useEffect(() => {
    if (locationFetched.current || !map) return
    locationFetched.current = true

    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        map.panTo(loc)
        map.setZoom(13)
      },
      () => {
        // Permission denied or unavailable — stay on Manila default
      },
      { timeout: 6000, maximumAge: 60000 }
    )
  }, [map])

  return (
    <>
      {/* User location — blue pulsing dot */}
      {userLocation && (
        <AdvancedMarker position={userLocation} title="Your location" zIndex={10}>
          <div className="relative flex items-center justify-center">
            <span className="absolute w-8 h-8 rounded-full bg-blue-400 opacity-30 animate-ping" />
            <span className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md" />
          </div>
        </AdvancedMarker>
      )}

      {/* Studio markers */}
      {studios.map((studio) => {
        if (!studio.coordinates) return null
        const isSelected = selectedStudio?.id === studio.id
        return (
          <AdvancedMarker
            key={studio.id}
            position={studio.coordinates}
            title={studio.name}
            onClick={() => setSelectedStudio(isSelected ? null : studio)}
            zIndex={isSelected ? 5 : 1}
          >
            <Pin
              background={isSelected ? '#5c7a6b' : '#ffffff'}
              borderColor={isSelected ? '#3d5247' : '#5c7a6b'}
              glyphColor={isSelected ? '#ffffff' : '#5c7a6b'}
              scale={isSelected ? 1.2 : 1}
            />
          </AdvancedMarker>
        )
      })}

      {/* Info window on selected studio */}
      {selectedStudio?.coordinates && (
        <InfoWindow
          position={selectedStudio.coordinates}
          onCloseClick={() => setSelectedStudio(null)}
          pixelOffset={[0, -48]}
        >
          <div className="p-1 min-w-[160px]">
            <p className="font-semibold text-sm text-gray-900">{selectedStudio.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{selectedStudio.address}</p>
            <button
              onClick={() => router.push(`/studios/${selectedStudio.id}`)}
              className="mt-2 text-xs font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
            >
              View studio →
            </button>
          </div>
        </InfoWindow>
      )}
    </>
  )
}

export default function StudioMap({ studios }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-sky/20 to-sage/20 flex flex-col items-center justify-center gap-2 text-muted">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        <span className="text-xs">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable map</span>
      </div>
    )
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        style={{ width: '100%', height: '100%' }}
        defaultCenter={MANILA_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        mapId="1bfa7673bcb65ded878640d4"
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        fullscreenControl={false}
        streetViewControl={false}
        clickableIcons={false}
      >
        <MapContent studios={studios} />
      </Map>
    </APIProvider>
  )
}
