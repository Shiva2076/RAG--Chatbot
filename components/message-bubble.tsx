"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Clock, Star } from "lucide-react"
import { useState } from "react"

interface Message {
  id: string
  type: "user" | "bot"
  content: string
  sources?: Array<{
    title: string
    url: string
    source: string
    publishedAt: string
    relevanceScore: number
  }>
  timestamp: string
}

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [showSources, setShowSources] = useState(false)

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (message.type === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] space-y-1">
          <Card className="bg-primary text-primary-foreground p-3">
            <p className="text-sm leading-relaxed">{message.content}</p>
          </Card>
          <p className="text-xs text-muted-foreground text-right">{formatTime(message.timestamp)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-2">
        <Card className="bg-card text-card-foreground p-4">
          <p className="text-sm leading-relaxed text-pretty">{message.content}</p>

          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSources(!showSources)}
                className="text-xs text-muted-foreground hover:text-foreground p-0 h-auto"
              >
                {showSources ? "Hide" : "Show"} {message.sources.length} source{message.sources.length !== 1 ? "s" : ""}
              </Button>

              {showSources && (
                <div className="mt-2 space-y-2">
                  {message.sources.map((source, index) => (
                    <Card key={index} className="bg-muted/50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-medium text-balance line-clamp-2">{source.title}</h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{source.source}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(source.publishedAt)}
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {Math.round(source.relevanceScore * 100)}%
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="shrink-0 h-6 w-6 p-0">
                          <a href={source.url} target="_blank" rel="noopener noreferrer" title="Read full article">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        <p className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</p>
      </div>
    </div>
  )
}
