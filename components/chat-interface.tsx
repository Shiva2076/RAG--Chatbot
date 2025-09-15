"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2 } from "lucide-react"
import { useSession } from "./session-provider"
import { MessageBubble } from "./message-bubble"
import { TypingIndicator } from "./typing-indicator"

export function ChatInterface() {
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, sendMessage, isLoading } = useSession()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const message = inputValue.trim()
    setInputValue("")
    await sendMessage(message)
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">NB</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-balance">Welcome to NewsBot</h2>
              <p className="text-muted-foreground max-w-md text-pretty">
                Ask me anything about recent news and I'll search through the latest articles to give you accurate,
                source-backed answers.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-lg">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputValue("What's the latest news today?")}
                className="text-left justify-start"
              >
                What's the latest news today?
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputValue("Tell me about recent technology updates")}
                className="text-left justify-start"
              >
                Technology updates
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputValue("What's happening in politics?")}
                className="text-left justify-start"
              >
                Political developments
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputValue("Show me business news")}
                className="text-left justify-start"
              >
                Business news
              </Button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me about the latest news..."
            disabled={isLoading}
            className="flex-1"
            maxLength={500}
          />
          <Button type="submit" disabled={!inputValue.trim() || isLoading} size="icon">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          NewsBot searches recent articles to provide accurate, source-backed answers
        </p>
      </div>
    </div>
  )
}
