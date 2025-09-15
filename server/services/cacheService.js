import { createHash } from "crypto";
import Redis from "ioredis";

const EMBEDDING_CACHE_PREFIX = "embedding:";
const QUERY_CACHE_PREFIX = "query:";
const SEARCH_CACHE_PREFIX = "search:";

const DEFAULT_EMBEDDING_TTL = 86400; // 24 hours
const DEFAULT_QUERY_TTL = 3600;      // 1 hour
const DEFAULT_SEARCH_TTL = 1800;     // 30 minutes

export class CacheService {
  constructor(redisOrUrl = "redis://localhost:6379") {
    if (typeof redisOrUrl === "string") {
      this.redis = new Redis(redisOrUrl, { reconnectOnError: () => true });
    } else if (redisOrUrl) {
      this.redis = redisOrUrl;
    } else {
      throw new Error("CacheService requires a Redis client or connection URL");
    }
  }

  // 🔑 Utility: Generate short cache keys
  generateKey(prefix, content) {
    const hash = createHash("sha256").update(content).digest("hex").substring(0, 16);
    return `${prefix}${hash}`;
  }

  /* ------------------- Embedding Cache ------------------- */
  // Add error handling
  async getEmbedding(text) {
    try {
      const key = this.generateKey(EMBEDDING_CACHE_PREFIX, text);
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Error getting embedding from cache:", error);
      return null; // Graceful degradation
    }
  }

  // Add connection health check
  async healthCheck() {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      console.error("Redis health check failed:", error);
      return false;
    }
  }

  async setEmbedding(text, embedding, ttl = DEFAULT_EMBEDDING_TTL) {
    try {
      const key = this.generateKey(EMBEDDING_CACHE_PREFIX, text);
      await this.redis.setex(key, ttl, JSON.stringify(embedding));
    } catch (error) {
      console.error("Error setting embedding in cache:", error);
    }
  }

  // Get multiple embeddings at once
  async getMultipleEmbeddings(texts) {
    try {
      const keys = texts.map(text => this.generateKey(EMBEDDING_CACHE_PREFIX, text));
      const cached = await this.redis.mget(keys);
      return cached.map(item => item ? JSON.parse(item) : null);
    } catch (error) {
      console.error("Error getting multiple embeddings from cache:", error);
      return texts.map(() => null);
    }
  }

  /* ------------------- Query Cache ------------------- */
  async getQueryResult(query) {
    try {
      const key = this.generateKey(QUERY_CACHE_PREFIX, query);
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Error getting query result from cache:", error);
      return null;
    }
  }

  async setQueryResult(query, result, ttl = DEFAULT_QUERY_TTL) {
    try {
      const key = this.generateKey(QUERY_CACHE_PREFIX, query);
      await this.redis.setex(key, ttl, JSON.stringify(result));
    } catch (error) {
      console.error("Error setting query result in cache:", error);
    }
  }

  /* ------------------- Search Cache ------------------- */
  async getSearchResults(queryEmbedding, limit) {
    try {
      const key = this.generateKey(
        SEARCH_CACHE_PREFIX,
        `${JSON.stringify(queryEmbedding)}_${limit}`
      );
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Error getting search results from cache:", error);
      return null;
    }
  }

  async setSearchResults(queryEmbedding, limit, results, ttl = DEFAULT_SEARCH_TTL) {
    try {
      const key = this.generateKey(
        SEARCH_CACHE_PREFIX,
        `${JSON.stringify(queryEmbedding)}_${limit}`
      );
      await this.redis.setex(key, ttl, JSON.stringify(results));
    } catch (error) {
      console.error("Error setting search results in cache:", error);
    }
  }

  /* ------------------- Warmup ------------------- */
  async warmEmbeddingCache(texts, embeddingFunction) {
    console.log(`Warming embedding cache for ${texts.length} texts...`);
    
    try {
      const cachedResults = await this.getMultipleEmbeddings(texts);
      const uncachedTexts = [];
      const uncachedIndices = [];

      for (let i = 0; i < texts.length; i++) {
        if (!cachedResults[i]) {
          uncachedTexts.push(texts[i]);
          uncachedIndices.push(i);
        }
      }

      if (uncachedTexts.length === 0) {
        console.log("All embeddings already cached");
        return cachedResults;
      }

      console.log(`Generating ${uncachedTexts.length} new embeddings`);
      
      // Use the provided embedding function instead of importing
      const newEmbeddings = await embeddingFunction(uncachedTexts);

      await Promise.all(
        uncachedTexts.map((text, i) =>
          this.setEmbedding(text, newEmbeddings[i], DEFAULT_EMBEDDING_TTL)
        )
      );

      // Update the results array with new embeddings
      uncachedIndices.forEach((originalIndex, i) => {
        cachedResults[originalIndex] = newEmbeddings[i];
      });

      console.log(`Cached ${uncachedTexts.length} new embeddings`);
      return cachedResults;
      
    } catch (error) {
      console.error("Error warming embedding cache:", error);
      throw error;
    }
  }

  /* ------------------- Stats ------------------- */
  async getCacheStats() {
    try {
      const keys = await this.redis.keys("*");
      return {
        totalKeys: keys.length,
        embeddings: keys.filter((k) => k.startsWith(EMBEDDING_CACHE_PREFIX)).length,
        queries: keys.filter((k) => k.startsWith(QUERY_CACHE_PREFIX)).length,
        searches: keys.filter((k) => k.startsWith(SEARCH_CACHE_PREFIX)).length,
        sessions: keys.filter((k) => k.startsWith("session:")).length,
        chatHistory: keys.filter((k) => k.startsWith("chat:")).length,
      };
    } catch (error) {
      console.error("Error getting cache stats:", error);
      return null;
    }
  }

  /* ------------------- Clear ------------------- */
  async clearCache(type = "all") {
    try {
      let pattern = "*";
      switch (type) {
        case "embeddings":
          pattern = `${EMBEDDING_CACHE_PREFIX}*`;
          break;
        case "queries":
          pattern = `${QUERY_CACHE_PREFIX}*`;
          break;
        case "searches":
          pattern = `${SEARCH_CACHE_PREFIX}*`;
          break;
      }

      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
        console.log(`Cleared ${keys.length} keys of type: ${type}`);
      }
      return keys.length;
    } catch (error) {
      console.error("Error clearing cache:", error);
      return 0;
    }
  }
}