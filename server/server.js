import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import Redis from "ioredis";
import { CacheService } from "./services/cacheService.js";

// Import routes
import chatRoutes from "./routes/chat.js";
import sessionRoutes from "./routes/session.js";
import ragRoutes from "./routes/rag.js";
import cacheRoutes from "./routes/cache.js";

dotenv.config();
console.log('JINA_API_KEY loaded:', process.env.JINA_API_KEY ? 'Yes' : 'No');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
});

// ✅ Use ioredis (not node-redis)
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  reconnectOnError: () => true,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

const cache = new CacheService(redis);

// ✅ Initialize embedding service BEFORE importing routes that use it
import { setCacheService } from "./services/embeddingService.js";
setCacheService(cache);

// ✅ Initialize Vector Database
import { initializeVectorDB, checkVectorDBHealth } from "./services/vectorService.js";

// Initialize all services
async function initializeServices() {
  try {
    console.log("🚀 Initializing services...");
    
    // Initialize vector database (creates collection if it doesn't exist)
    console.log("📊 Initializing Vector Database...");
    await initializeVectorDB();
    
    // Check vector DB health
    const vectorHealth = await checkVectorDBHealth();
    console.log("🏥 Vector DB Health:", vectorHealth);
    
    console.log("✅ All services initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize services:", error);
    console.error("🔍 Error details:", error.message);
    // Don't exit the process, just log the error
    console.log("⚠️  Server will continue but vector search may not work");
  }
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Make redis + cache available to routes
app.use((req, res, next) => {
  req.redis = redis;
  req.cache = cache;
  req.io = io;
  next();
});

// Routes
app.use("/api/chat", chatRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/rag", ragRoutes);
app.use("/api/cache", cacheRoutes);

// Health check with Redis and Vector DB status
app.get("/health", async (req, res) => {
  try {
    const cacheHealth = await cache.healthCheck();
    const vectorHealth = await checkVectorDBHealth();
    
    res.json({ 
      status: "OK", 
      redis: cacheHealth ? "connected" : "disconnected",
      vectorDB: vectorHealth.status,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(500).json({ 
      status: "ERROR", 
      error: error.message 
    });
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-session", (sessionId) => {
    socket.join(sessionId);
    console.log(`Socket ${socket.id} joined session ${sessionId}`);
  });

  socket.on("chat-message", async (data) => {
    try {
      const { sessionId, message } = data;
      console.log(`Chat message in session ${sessionId}:`, message);
      
      // Broadcast to all clients in the session
      socket.to(sessionId).emit("chat-message", {
        role: "user",
        message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Socket chat error:", error);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("User disconnected:", socket.id, "Reason:", reason);
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? error.message : "Something went wrong"
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  
  // Initialize services after server starts
  await initializeServices();
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await redis.quit();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

export { redis, io };