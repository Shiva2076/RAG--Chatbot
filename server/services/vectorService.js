// Load environment variables first!
import dotenv from 'dotenv';
dotenv.config();

import { QdrantClient } from "@qdrant/js-client-rest"

console.log("🔗 Initializing Qdrant client...");
console.log("🌐 QDRANT_URL:", process.env.QDRANT_URL || "DEFAULT: http://localhost:6333");
console.log("🔑 QDRANT_API_KEY available:", !!process.env.QDRANT_API_KEY);
console.log("🔑 QDRANT_API_KEY first 20 chars:", process.env.QDRANT_API_KEY?.substring(0, 20));

// Add more detailed debugging
if (!process.env.QDRANT_URL) {
  console.warn("⚠️  QDRANT_URL not set! Using localhost:6333");
}
if (!process.env.QDRANT_API_KEY) {
  console.warn("⚠️  QDRANT_API_KEY not set!");
}

const client = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY,
})

const COLLECTION_NAME = "news_articles"

export async function initializeVectorDB() {
  try {
    console.log("🚀 Initializing vector database...");
    console.log("📦 Collection name:", COLLECTION_NAME);
    
    // Check if collection exists
    console.log("🔍 Checking if collection exists...");
    const collections = await client.getCollections()
    console.log("📋 Found collections:", collections.collections.map(c => c.name));
    
    const collectionExists = collections.collections.some((col) => col.name === COLLECTION_NAME)
    console.log("✅ Collection exists:", collectionExists);

    if (!collectionExists) {
      console.log("🏗️ Creating new collection...");
      // Create collection
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 768, // Jina embeddings dimension
          distance: "Cosine",
        },
      })
      console.log(`✅ Created collection: ${COLLECTION_NAME}`)
    } else {
      console.log(`✅ Collection ${COLLECTION_NAME} already exists`);
    }
  } catch (error) {
    console.error("❌ Error initializing vector DB:", error.message);
    console.error("🔍 Full error:", error);
    throw error
  }
}

export async function storeDocuments(documents) {
  try {
    console.log(`📤 Storing ${documents.length} documents...`);
    
    const points = documents.map((doc, index) => ({
      id: doc.id || index,
      vector: doc.embedding,
      payload: {
        title: doc.title,
        content: doc.content,
        url: doc.url,
        publishedAt: doc.publishedAt,
        source: doc.source,
        summary: doc.summary,
      },
    }))

    console.log("📋 Sample point structure:", {
      id: points[0]?.id,
      vectorLength: points[0]?.vector?.length,
      payloadKeys: points[0] ? Object.keys(points[0].payload) : []
    });

    await client.upsert(COLLECTION_NAME, {
      wait: true,
      points: points,
    })

    console.log(`✅ Successfully stored ${points.length} documents in vector DB`)
    return points.length
  } catch (error) {
    console.error("❌ Error storing documents:", error.message);
    console.error("🔍 Full error:", error);
    throw error
  }
}

export async function searchSimilarDocuments(queryEmbedding, limit = 5) {
  try {
    console.log(`🔍 Searching for similar documents (limit: ${limit})...`);
    console.log("🎯 Query embedding length:", queryEmbedding?.length);
    
    const searchResult = await client.search(COLLECTION_NAME, {
      vector: queryEmbedding,
      limit: limit,
      with_payload: true,
    })

    console.log(`📊 Found ${searchResult.length} similar documents`);
    console.log("📈 Top scores:", searchResult.slice(0, 3).map(r => r.score));

    const results = searchResult.map((result) => ({
      id: result.id,
      score: result.score,
      title: result.payload.title,
      content: result.payload.content,
      url: result.payload.url,
      publishedAt: result.payload.publishedAt,
      source: result.payload.source,
      summary: result.payload.summary,
    }));

    console.log("✅ Search completed successfully");
    return results;
  } catch (error) {
    console.error("❌ Error searching documents:", error.message);
    console.error("🔍 Full error:", error);
    throw error
  }
}

export async function getCollectionInfo() {
  try {
    console.log("📊 Getting collection info...");
    
    const info = await client.getCollection(COLLECTION_NAME)
    
    const result = {
      pointsCount: info.points_count,
      status: info.status,
      vectorsCount: info.vectors_count,
    };
    
    console.log("📈 Collection info:", result);
    return result;
  } catch (error) {
    console.error("❌ Error getting collection info:", error.message);
    console.log("⚠️ Returning default values");
    return { pointsCount: 0, status: "unknown", vectorsCount: 0 }
  }
}

// Health check function
export async function checkVectorDBHealth() {
  try {
    console.log("🏥 Running vector DB health check...");
    
    // Try to get collections to test connection
    const collections = await client.getCollections();
    console.log("✅ Vector DB is healthy - found collections:", collections.collections.length);
    
    return {
      status: "healthy",
      collections: collections.collections.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("❌ Vector DB health check failed:", error.message);
    return {
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}