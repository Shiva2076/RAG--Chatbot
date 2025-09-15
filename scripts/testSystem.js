import dotenv from "dotenv"
import fetch from "node-fetch"

dotenv.config()

const API_BASE = process.env.API_URL || "http://localhost:5000"

async function testSystemHealth() {
  console.log("🔍 Testing RAG Chatbot System Health...")

  try {
    // Test health endpoint
    console.log("\n1. Testing health endpoint...")
    const healthResponse = await fetch(`${API_BASE}/health`)
    const healthData = await healthResponse.json()
    console.log("✅ Health check:", healthData.status)

    // Test session creation
    console.log("\n2. Testing session creation...")
    const sessionResponse = await fetch(`${API_BASE}/api/session/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
    const sessionData = await sessionResponse.json()
    console.log("✅ Session created:", sessionData.sessionId)

    // Test RAG status
    console.log("\n3. Testing RAG system status...")
    const ragResponse = await fetch(`${API_BASE}/api/rag/status`)
    const ragData = await ragResponse.json()
    console.log("✅ RAG status:", ragData.status)

    // Test cache stats
    console.log("\n4. Testing cache system...")
    const cacheResponse = await fetch(`${API_BASE}/api/cache/stats`)
    const cacheData = await cacheResponse.json()
    console.log("✅ Cache stats:", cacheData)

    // Test message sending
    console.log("\n5. Testing message processing...")
    const messageResponse = await fetch(`${API_BASE}/api/chat/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionData.sessionId,
        message: "What's the latest news?",
      }),
    })

    if (messageResponse.ok) {
      const messageData = await messageResponse.json()
      console.log("✅ Message processed successfully")
      console.log("📝 Response preview:", messageData.content.substring(0, 100) + "...")
      console.log("📚 Sources found:", messageData.sources?.length || 0)
    } else {
      console.log("❌ Message processing failed:", messageResponse.statusText)
    }

    // Test session history
    console.log("\n6. Testing session history...")
    const historyResponse = await fetch(`${API_BASE}/api/session/${sessionData.sessionId}/history`)
    const historyData = await historyResponse.json()
    console.log("✅ History retrieved:", historyData.messages.length, "messages")

    console.log("\n🎉 System health test completed successfully!")
  } catch (error) {
    console.error("❌ System health test failed:", error.message)
    process.exit(1)
  }
}

// Performance test
async function testPerformance() {
  console.log("\n⚡ Running performance tests...")

  const queries = [
    "What's happening in technology?",
    "Tell me about recent political news",
    "What are the latest business updates?",
    "Show me sports news",
    "What's new in science?",
  ]

  try {
    // Create session
    const sessionResponse = await fetch(`${API_BASE}/api/session/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
    const { sessionId } = await sessionResponse.json()

    const results = []

    for (const query of queries) {
      const startTime = Date.now()

      const response = await fetch(`${API_BASE}/api/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: query }),
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      if (response.ok) {
        const data = await response.json()
        results.push({
          query,
          responseTime,
          sourcesFound: data.sources?.length || 0,
          success: true,
        })
      } else {
        results.push({
          query,
          responseTime,
          success: false,
          error: response.statusText,
        })
      }
    }

    console.log("\n📊 Performance Results:")
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.query}`)
      console.log(`   ⏱️  Response time: ${result.responseTime}ms`)
      console.log(`   📚 Sources: ${result.sourcesFound}`)
      console.log(`   ✅ Success: ${result.success}`)
      console.log()
    })

    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
    console.log(`📈 Average response time: ${avgResponseTime.toFixed(2)}ms`)
  } catch (error) {
    console.error("❌ Performance test failed:", error.message)
  }
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
  await testSystemHealth()
  await testPerformance()
}

export { testSystemHealth, testPerformance }
