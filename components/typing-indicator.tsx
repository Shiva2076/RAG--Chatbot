"use client"

import { Card } from "@/components/ui/card"

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <Card className="bg-card text-card-foreground p-4 max-w-[200px]">
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">NewsBot is thinking</span>
          <div className="flex gap-1 ml-2">
            <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"></div>
          </div>
        </div>
      </Card>
    </div>
  )
}
