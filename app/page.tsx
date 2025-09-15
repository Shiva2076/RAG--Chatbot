"use client"
import { ChatInterface } from "@/components/chat-interface"
import { SessionProvider } from "@/components/session-provider"
import { Header } from "@/components/header"
import { PerformanceMonitor } from "@/components/performance-monitor"

export default function HomePage() {
  return (
    <SessionProvider>
      <div className="flex flex-col h-screen bg-background">
        <Header />
        <main className="flex-1 overflow-hidden">
          <ChatInterface />
        </main>
        <PerformanceMonitor />
      </div>
    </SessionProvider>
  )
}
