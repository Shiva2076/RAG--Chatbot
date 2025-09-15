"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { io, type Socket } from "socket.io-client"

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

interface SessionContextType {
  sessionId: string | null
  messages: Message[]
  isConnected: boolean
  socket: Socket | null
  sendMessage: (message: string) => Promise<void>
  clearSession: () => Promise<void>
  isLoading: boolean
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

  useEffect(() => {
    // Create new session on mount
    createSession()

    // Initialize socket connection
    const newSocket = io(API_BASE)
    setSocket(newSocket)

    newSocket.on("connect", () => {
      setIsConnected(true)
      console.log("Connected to server")
    })

    newSocket.on("disconnect", () => {
      setIsConnected(false)
      console.log("Disconnected from server")
    })

    newSocket.on("new-message", (message: Message) => {
      setMessages((prev) => [...prev, message])
    })

    return () => {
      newSocket.close()
    }
  }, [])

  useEffect(() => {
    if (sessionId && socket && isConnected) {
      socket.emit("join-session", sessionId)
      loadChatHistory()
    }
  }, [sessionId, socket, isConnected])

  const createSession = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/session/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await response.json()
      setSessionId(data.sessionId)
    } catch (error) {
      console.error("Error creating session:", error)
    }
  }

  const loadChatHistory = async () => {
    if (!sessionId) return

    try {
      const response = await fetch(`${API_BASE}/api/session/${sessionId}/history`)
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error("Error loading chat history:", error)
    }
  }

  const sendMessage = async (message: string) => {
    if (!sessionId || isLoading) return

    setIsLoading(true)

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      const response = await fetch(`${API_BASE}/api/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const botMessage = await response.json()
      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: "bot",
        content: "Sorry, I encountered an error processing your message. Please try again.",
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const clearSession = async () => {
    if (!sessionId) return

    try {
      await fetch(`${API_BASE}/api/session/${sessionId}/clear`, {
        method: "DELETE",
      })
      setMessages([])
    } catch (error) {
      console.error("Error clearing session:", error)
    }
  }

  return (
    <SessionContext.Provider
      value={{
        sessionId,
        messages,
        isConnected,
        socket,
        sendMessage,
        clearSession,
        isLoading,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return context
}
