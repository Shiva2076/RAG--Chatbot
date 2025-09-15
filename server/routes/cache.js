import express from "express";
import { warmEmbeddingCache } from "../services/embeddingService.js";

const router = express.Router();

// Get cache statistics
router.get("/stats", async (req, res) => {
  try {
    const stats = await req.cache.getCacheStats();
    res.json({
      ...stats,
      status: "success",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error getting cache stats:", error);
    res.status(500).json({ 
      error: "Failed to get cache statistics",
      status: "error" 
    });
  }
});

// Clear cache
router.delete("/clear/:type?", async (req, res) => {
  try {
    const { type = "all" } = req.params;
    const clearedCount = await req.cache.clearCache(type);

    res.json({
      type,
      clearedKeys: clearedCount,
      timestamp: new Date().toISOString(),
      status: "success"
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    res.status(500).json({ 
      error: "Failed to clear cache",
      status: "error" 
    });
  }
});

// Warm embedding cache with popular queries
router.post("/warm", async (req, res) => {
  try {
    const { queries } = req.body;

    const defaultQueries = [
      "latest news today",
      "breaking news",
      "technology updates",
      "political developments",
      "business news",
      "sports news",
      "health news",
      "climate change news",
      "economic updates",
      "international news",
    ];

    const queriesToWarm = queries || defaultQueries;
    await warmEmbeddingCache(queriesToWarm);

    res.json({
      warmed: queriesToWarm.length,
      queries: queriesToWarm,
      timestamp: new Date().toISOString(),
      status: "success"
    });
  } catch (error) {
    console.error("Error warming cache:", error);
    res.status(500).json({ 
      error: "Failed to warm cache",
      details: error.message,
      status: "error" 
    });
  }
});

// Get cache health
router.get("/health", async (req, res) => {
  try {
    const cacheHealth = await req.cache.healthCheck();
    res.json({
      cache: cacheHealth ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
      status: "success"
    });
  } catch (error) {
    res.status(500).json({
      cache: "error",
      error: error.message,
      status: "error"
    });
  }
});

export default router;