import fetch from "node-fetch"

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

export async function generateAnswer(query, context, streamCallback = null) {
  try {
    const prompt = `You are a helpful news assistant. Answer the user's question based on the provided news context. Be accurate, concise, and cite relevant information from the sources.

Context from recent news articles:
${context}

User Question: ${query}

Please provide a comprehensive answer based on the news context above. If the context doesn't contain enough information to fully answer the question, mention that and provide what information is available.`

    const response = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response generated from Gemini API")
    }

    const answer = data.candidates[0].content.parts[0].text

    // If streaming callback provided, simulate streaming
    if (streamCallback) {
      const words = answer.split(" ")
      for (let i = 0; i < words.length; i++) {
        streamCallback(words[i] + " ")
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
    }

    return answer
  } catch (error) {
    console.error("Error generating answer:", error)
    return "I apologize, but I'm having trouble generating a response right now. Please try again later."
  }
}
