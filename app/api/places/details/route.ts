import { NextRequest } from 'next/server'

// GET /api/places/details?placeId=... — server-side Places API (New) place details
export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get('placeId')?.trim()
  if (!placeId) return Response.json({ error: 'placeId required' }, { status: 400 })

  const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) return Response.json({ error: 'No API key' }, { status: 500 })

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'formattedAddress,location',
        },
      }
    )

    if (!res.ok) return Response.json({ error: 'Places API error' }, { status: res.status })

    const data = await res.json()
    return Response.json({
      address: data.formattedAddress ?? '',
      lat: data.location?.latitude ?? null,
      lng: data.location?.longitude ?? null,
    })
  } catch {
    return Response.json({ error: 'Failed to fetch place details' }, { status: 500 })
  }
}
