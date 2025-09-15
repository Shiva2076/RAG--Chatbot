import express from "express"
import { v4 as uuidv4 } from "uuid"
import { processQuery } from "../services/ragService.js"
import { addMessageToHistory } from "../services/sessionService.js"

const router = express.Router()

// Send a message and get RAG response
router.post("/message", async (req, res) => {
  try {
    const { sessionId, message } = req.body

    if (!sessionId || !message) {
      return res.status(400).json({ error: "Session ID and message are required" })
    }

    // Add user message to history
    await addMessageToHistory(req.redis, sessionId, {
      id: uuidv4(),
      type: "user",
      content: message,
      timestamp: new Date().toISOString(),
    })

    // Process query through RAG pipeline
    const response = await processQuery(message)

    // Add bot response to history
    const botMessage = {
      id: uuidv4(),
      type: "bot",
      content: response.answer,
      sources: response.sources,
      timestamp: new Date().toISOString(),
    }

    await addMessageToHistory(req.redis, sessionId, botMessage)

    // Emit to socket room for real-time updates
    req.io.to(sessionId).emit("new-message", botMessage)

    res.json(botMessage)
  } catch (error) {
    console.error("Error processing message:", error)
    res.status(500).json({ error: "Failed to process message" })
  }
})

// Stream message response (for real-time typing effect)
router.post("/stream", async (req, res) => {
  try {
    const { sessionId, message } = req.body

    if (!sessionId || !message) {
      return res.status(400).json({ error: "Session ID and message are required" })
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    })

    // Add user message to history
    await addMessageToHistory(req.redis, sessionId, {
      id: uuidv4(),
      type: "user",
      content: message,
      timestamp: new Date().toISOString(),
    })

    // Process query and stream response
    const response = await processQuery(message, (chunk) => {
      res.write(`data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`)
    })

    // Send final response
    const botMessage = {
      id: uuidv4(),
      type: "bot",
      content: response.answer,
      sources: response.sources,
      timestamp: new Date().toISOString(),
    }

    await addMessageToHistory(req.redis, sessionId, botMessage)

    res.write(`data: ${JSON.stringify({ type: "complete", message: botMessage })}\n\n`)
    res.end()
  } catch (error) {
    console.error("Error streaming message:", error)
    res.write(`data: ${JSON.stringify({ type: "error", error: "Failed to process message" })}\n\n`)
    res.end()
  }
})

export default router
