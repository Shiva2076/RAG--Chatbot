const rateLimitStore = new Map()

export function createRateLimiter(windowMs = 60000, maxRequests = 100) {
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress
    const now = Date.now()
    const windowStart = now - windowMs

    // Clean old entries
    if (rateLimitStore.has(clientId)) {
      const requests = rateLimitStore.get(clientId).filter((time) => time > windowStart)
      rateLimitStore.set(clientId, requests)
    }

    // Get current requests in window
    const requests = rateLimitStore.get(clientId) || []

    if (requests.length >= maxRequests) {
      return res.status(429).json({
        error: "Too many requests",
        retryAfter: Math.ceil(windowMs / 1000),
      })
    }

    // Add current request
    requests.push(now)
    rateLimitStore.set(clientId, requests)

    next()
  }
}
