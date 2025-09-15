import express from "express"
import { v4 as uuidv4 } from "uuid"
import { getChatHistory, clearChatHistory, createSession } from "../services/sessionService.js"

const router = express.Router()

// Create new session
router.post("/create", async (req, res) => {
  try {
    const sessionId = uuidv4()
    await createSession(req.redis, sessionId)

    res.json({ sessionId, created: new Date().toISOString() })
  } catch (error) {
    console.error("Error creating session:", error)
    res.status(500).json({ error: "Failed to create session" })
  }
})

// Get session history
router.get("/:sessionId/history", async (req, res) => {
  try {
    const { sessionId } = req.params
    const history = await getChatHistory(req.redis, sessionId)

    res.json({ sessionId, messages: history })
  } catch (error) {
    console.error("Error fetching history:", error)
    res.status(500).json({ error: "Failed to fetch chat history" })
  }
})

// Clear session history
router.delete("/:sessionId/clear", async (req, res) => {
  try {
    const { sessionId } = req.params
    await clearChatHistory(req.redis, sessionId)

    res.json({ sessionId, cleared: true, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error("Error clearing history:", error)
    res.status(500).json({ error: "Failed to clear chat history" })
  }
})

export default router
