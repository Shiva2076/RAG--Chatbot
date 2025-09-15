"use client"

import { Button } from "@/components/ui/button"
import { RotateCcw, Wifi, WifiOff } from "lucide-react"
import { useSession } from "./session-provider"

export function Header() {
  const { clearSession, isConnected, sessionId } = useSession()

  const handleReset = async () => {
    if (confirm("Are you sure you want to clear the chat history?")) {
      await clearSession()
    }
  }

  return (
    <header className="border-b border-border bg-card px-4 py-3">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">NB</span>
          </div>
          <div>
            <h1 className="font-semibold text-lg text-balance">NewsBot</h1>
            <p className="text-sm text-muted-foreground">RAG-Powered News Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-destructive" />
            )}
            <span className="text-muted-foreground">{isConnected ? "Connected" : "Disconnected"}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-2 bg-transparent"
            disabled={!sessionId}
          >
            <RotateCcw className="w-4 h-4" />
            Reset Chat
          </Button>
        </div>
      </div>
    </header>
  )
}
