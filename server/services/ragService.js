import { getEmbedding } from "./embeddingService.js";
import { searchSimilarDocuments } from "./vectorService.js";
import { generateAnswer } from "./llmService.js";
import { CacheService } from "./cacheService.js";
// import { cache } from "../server.js";


// ✅ Initialize CacheService with REDIS_URL directly
 const cache = new CacheService(process.env.REDIS_URL);

export async function processQuery(query, streamCallback = null) {
  try {
    console.log(`Processing query: ${query}`);

    // 1. Try full query cache
    const cachedResult = await cache.getQueryResult(query);
    if (cachedResult) {
      console.log("Cache hit for complete query result");

      if (streamCallback) {
        const words = cachedResult.answer.split(" ");
        for (let i = 0; i < words.length; i++) {
          streamCallback(words[i] + " ");
          await new Promise((resolve) => setTimeout(resolve, 30));
        }
      }

      return cachedResult;
    }

    console.log("Cache miss - processing new query");

    // 2. Get query embedding
    const queryEmbedding = await getEmbedding(query);

    // 3. Search cache for results
    const cachedSearchResults = await cache.getSearchResults(queryEmbedding, 5);
    let similarDocs;

    if (cachedSearchResults) {
      console.log("Cache hit for search results");
      similarDocs = cachedSearchResults;
    } else {
      console.log("Cache miss - searching vector database");
      similarDocs = await searchSimilarDocuments(queryEmbedding, 5);
      await cache.setSearchResults(queryEmbedding, 5, similarDocs);
    }

    if (similarDocs.length === 0) {
      const result = {
        answer:
          "I couldn't find any relevant information in the news database to answer your question.",
        sources: [],
      };
      await cache.setQueryResult(query, result, 1800);
      return result;
    }

    // 4. Build context for LLM
    const context = similarDocs
      .map(
        (doc, index) =>
          `[${index + 1}] ${doc.title}\n${
            doc.summary || doc.content.substring(0, 300)
          }`
      )
      .join("\n\n");

    // 5. Generate answer
    const answer = await generateAnswer(query, context, streamCallback);

    // 6. Build sources
    const sources = similarDocs.map((doc) => ({
      title: doc.title,
      url: doc.url,
      source: doc.source,
      publishedAt: doc.publishedAt,
      relevanceScore: doc.score,
    }));

    const result = { answer, sources, retrievedDocs: similarDocs.length };

    await cache.setQueryResult(query, result);

    return result;
  } catch (error) {
    console.error("Error processing query:", error);
    throw error;
  }
}
