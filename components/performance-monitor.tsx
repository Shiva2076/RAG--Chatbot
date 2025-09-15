"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Database, Zap } from "lucide-react"

interface CacheStats {
  totalKeys: number
  embeddings: number
  queries: number
  searches: number
  sessions: number
  chatHistory: number
}

export function PerformanceMonitor() {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === "development") {
      setIsVisible(true)
      fetchCacheStats()
      const interval = setInterval(fetchCacheStats, 30000) // Update every 30s
      return () => clearInterval(interval)
    }
  }, [])

  const fetchCacheStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/cache/stats`)
      if (response.ok) {
        const stats = await response.json()
        setCacheStats(stats)
      }
    } catch (error) {
      console.error("Failed to fetch cache stats:", error)
    }
  }

  if (!isVisible || !cacheStats) return null

  return (
    <Card className="fixed bottom-4 right-4 p-3 bg-card/95 backdrop-blur-sm border shadow-lg max-w-xs">
      <div className="flex items-center gap-2 mb-2">
        <Activity className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Cache Stats</span>
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Keys:</span>
          <Badge variant="secondary" className="text-xs">
            {cacheStats.totalKeys}
          </Badge>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Embeddings:
          </span>
          <Badge variant="outline" className="text-xs">
            {cacheStats.embeddings}
          </Badge>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <Database className="w-3 h-3" />
            Queries:
          </span>
          <Badge variant="outline" className="text-xs">
            {cacheStats.queries}
          </Badge>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Sessions:</span>
          <Badge variant="outline" className="text-xs">
            {cacheStats.sessions}
          </Badge>
        </div>
      </div>
    </Card>
  )
}
