'use client'

import { useEffect, useState } from 'react'
import { getStudios, getSessions, getProducts, getWallet, getMe } from '@/lib/api'
import { Card } from '@/components/ui'

export default function DevPage() {
  const [data, setData] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const [me, studios, sessions, products, wallet] = await Promise.all([
        getMe(),
        getStudios(),
        getSessions(),
        getProducts(),
        getWallet('user-1'),
      ])
      setData({ me, studios, sessions: sessions.slice(0, 5), products, wallet })
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) return <div className="p-6 text-muted">Loading...</div>

  return (
    <div className="min-h-screen bg-bg p-4 space-y-4">
      <h1 className="text-xl font-bold text-text">API Dev Console</h1>
      
      {Object.entries(data).map(([key, value]) => (
        <Card key={key}>
          <h2 className="font-semibold text-text mb-2">{key}</h2>
          <pre className="text-xs text-muted overflow-auto max-h-48">
            {JSON.stringify(value, null, 2)}
          </pre>
        </Card>
      ))}
    </div>
  )
}
