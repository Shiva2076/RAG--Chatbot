import fetch from "node-fetch";

const JINA_API_URL = "https://api.jina.ai/v1/embeddings";

// Singleton cache instance
let cacheInstance = null;

// Helper function to ensure cache is initialized
function ensureCacheInitialized() {
  if (!cacheInstance) {
    throw new Error("Cache service not initialized. Call setCacheService first.");
  }
  return cacheInstance;
}

export function setCacheService(cacheService) {
  cacheInstance = cacheService;
  console.log("Cache service initialized for embedding service");
}

// Helper function for retry logic
async function withRetry(operation, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`Retry attempt ${i + 1} failed, waiting ${delay * (i + 1)}ms`);
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
}

export async function getEmbedding(text) {
  console.log("🔍 Starting getEmbedding for text:", text.substring(0, 50) + "...");
  
  const cache = ensureCacheInitialized();
  console.log("✅ Cache initialized");

  // Check cache first
  const cached = await cache.getEmbedding(text);
  if (cached) {
    console.log("💾 Cache hit for embedding");
    return cached;
  }

  console.log("🚫 Cache miss - generating new embedding");
  
  // Check if API key is available
  console.log("🔑 API Key available:", !!process.env.JINA_API_KEY);
  console.log("🔑 API Key first 10 chars:", process.env.JINA_API_KEY?.substring(0, 10));

  // REMOVED THE PROBLEMATIC LINE THAT WAS CAUSING THE ERROR:
  // JINA_API_KEY=jina_75ee8c0691e64dd7b0ac35f86175f837QPA5tzdyKHx2EBugSvpOj5CyzWdf
  
  const embedding = await withRetry(async () => {
    console.log("📡 Making API call to Jina...");
    
    const response = await fetch(JINA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.JINA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "jina-embeddings-v2-base-en",
        input: [text],
      }),
    });

    console.log("📡 Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error:", response.statusText, errorText);
      throw new Error(`Jina API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Successfully got embedding, length:", data.data[0].embedding.length);
    return data.data[0].embedding;
  });

  // Cache the result
  console.log("💾 Caching embedding result");
  await cache.setEmbedding(text, embedding);
  return embedding;
}

export async function getBatchEmbeddings(texts) {
  console.log("🔍 Starting getBatchEmbeddings for", texts.length, "texts");
  
  const cache = ensureCacheInitialized();

  const results = [];
  const uncachedTexts = [];
  const uncachedIndices = [];

  // Check cache for all texts
  console.log("💾 Checking cache for all texts...");
  for (let i = 0; i < texts.length; i++) {
    const cached = await cache.getEmbedding(texts[i]);
    if (cached) {
      results[i] = cached;
    } else {
      uncachedTexts.push(texts[i]);
      uncachedIndices.push(i);
    }
  }

  console.log("💾 Cache hits:", texts.length - uncachedTexts.length);
  console.log("🚫 Cache misses:", uncachedTexts.length);

  if (uncachedTexts.length === 0) {
    console.log("✅ All embeddings found in cache");
    return results;
  }

  console.log(`📡 Generating ${uncachedTexts.length} new embeddings`);

  const newEmbeddings = await withRetry(async () => {
    const response = await fetch(JINA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.JINA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "jina-embeddings-v2-base-en",
        input: uncachedTexts,
      }),
    });

    console.log("📡 Batch response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Batch API Error:", response.statusText, errorText);
      throw new Error(`Jina API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Successfully got batch embeddings");
    return data.data.map((item) => item.embedding);
  });

  // Cache the new embeddings
  console.log("💾 Caching new embeddings...");
  for (let i = 0; i < uncachedIndices.length; i++) {
    const embedding = newEmbeddings[i];
    const originalIndex = uncachedIndices[i];
    const originalText = texts[originalIndex];

    results[originalIndex] = embedding;
    await cache.setEmbedding(originalText, embedding);
  }

  console.log("✅ Batch embeddings completed");
  return results;
}

// Warm embedding cache
export async function warmEmbeddingCache(texts) {
  const cache = ensureCacheInitialized();

  console.log(`🔥 Warming embedding cache for ${texts.length} texts...`);
  
  try {
    // Use the existing batch functionality
    await getBatchEmbeddings(texts);
    console.log(`✅ Successfully warmed cache for ${texts.length} texts`);
  } catch (error) {
    console.error("❌ Error warming embedding cache:", error);
    throw error;
  }
}

// Health check
export async function checkEmbeddingServiceHealth() {
  console.log("🏥 Running embedding service health check...");
  
  try {
    // Test with a small embedding
    await getEmbedding("test");
    console.log("✅ Embedding service is healthy");
    return { status: "healthy", timestamp: new Date().toISOString() };
  } catch (error) {
    console.error("❌ Embedding service is unhealthy:", error.message);
    return { 
      status: "unhealthy", 
      error: error.message,
      timestamp: new Date().toISOString() 
    };
  }
}