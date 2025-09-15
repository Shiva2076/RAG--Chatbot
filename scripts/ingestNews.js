import dotenv from "dotenv"
import { fetchNewsFromRSS, cleanArticleContent, createArticleSummary } from "../services/newsService.js"
import { getBatchEmbeddings } from "../services/embeddingService.js"
import { initializeVectorDB, storeDocuments } from "../services/vectorService.js"

dotenv.config()

async function ingestNewsArticles() {
  try {
    console.log("Starting news ingestion process...")

    // Initialize vector database
    console.log("Initializing vector database...")
    await initializeVectorDB()

    // Fetch news articles
    console.log("Fetching news articles...")
    const articles = await fetchNewsFromRSS(undefined, 50)

    if (articles.length === 0) {
      console.log("No articles found to ingest")
      return
    }

    // Clean and prepare articles
    console.log("Processing articles...")
    const processedArticles = articles.map((article) => ({
      ...article,
      content: cleanArticleContent(article.content),
      summary: createArticleSummary(article.content),
    }))

    // Create embeddings in batches
    console.log("Creating embeddings...")
    const batchSize = 10
    const articlesWithEmbeddings = []

    for (let i = 0; i < processedArticles.length; i += batchSize) {
      const batch = processedArticles.slice(i, i + batchSize)
      const texts = batch.map((article) => `${article.title}\n\n${article.content}`)

      try {
        const embeddings = await getBatchEmbeddings(texts)

        batch.forEach((article, index) => {
          articlesWithEmbeddings.push({
            ...article,
            embedding: embeddings[index],
          })
        })

        console.log(
          `Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(processedArticles.length / batchSize)}`,
        )
      } catch (error) {
        console.error(`Error processing batch ${i / batchSize + 1}:`, error)
      }
    }

    // Store in vector database
    console.log("Storing documents in vector database...")
    const storedCount = await storeDocuments(articlesWithEmbeddings)

    console.log(`Successfully ingested ${storedCount} articles`)
    console.log("News ingestion completed!")
  } catch (error) {
    console.error("Error during news ingestion:", error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestNewsArticles()
}

export { ingestNewsArticles }
