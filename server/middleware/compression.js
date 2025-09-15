import compression from "compression"

// Compression middleware for better performance
export const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) {
      return false
    }
    return compression.filter(req, res)
  },
  level: 6, // Good balance between compression and speed
  threshold: 1024, // Only compress responses larger than 1KB
})
