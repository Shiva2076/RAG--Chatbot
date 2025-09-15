import express from "express"
import { searchSimilarDocuments } from "../services/vectorService.js"
import { getEmbedding } from "../services/embeddingService.js"

const router = express.Router()

// Search similar documents
router.post("/search", async (req, res) => {
  try {
    const { query, limit = 5 } = req.body

    if (!query) {
      return res.status(400).json({ error: "Query is required" })
    }

    // Get query embedding
    const queryEmbedding = await getEmbedding(query)

    // Search similar documents
    const results = await searchSimilarDocuments(queryEmbedding, limit)

    res.json({ query, results })
  } catch (error) {
    console.error("Error searching documents:", error)
    res.status(500).json({ error: "Failed to search documents" })
  }
})

// Get ingestion status
router.get("/status", async (req, res) => {
  try {
    // This would check the vector database for document count
    res.json({
      status: "ready",
      documentsIngested: 0, // This would be dynamic
      lastUpdate: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error getting RAG status:", error)
    res.status(500).json({ error: "Failed to get RAG status" })
  }
})

export default router
