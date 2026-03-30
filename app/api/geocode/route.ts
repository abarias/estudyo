import { NextRequest } from 'next/server'

// GET /api/geocode?lat=...&lng=... — reverse geocode coordinates to a human-readable address
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) return Response.json({ error: 'lat and lng required' }, { status: 400 })

  const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) return Response.json({ address: `${lat}, ${lng}` })

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    )
    const data = await res.json()
    const address = data.results?.[0]?.formatted_address ?? `${lat}, ${lng}`
    return Response.json({ address })
  } catch {
    return Response.json({ address: `${lat}, ${lng}` })
  }
}
