import { NextRequest } from 'next/server'

// GET /api/places/autocomplete?input=... — server-side Places API (New) autocomplete
export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get('input')?.trim()
  if (!input) return Response.json([])

  const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) return Response.json([])

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify({ input }),
    })

    if (!res.ok) return Response.json([])

    const data = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const suggestions = (data.suggestions ?? []).map((s: any) => ({
      placeId: s.placePrediction?.placeId ?? '',
      description: s.placePrediction?.text?.text ?? '',
    })).filter((s: { placeId: string }) => s.placeId)

    return Response.json(suggestions)
  } catch {
    return Response.json([])
  }
}
