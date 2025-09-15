import Parser from "rss-parser"
import axios from "axios"
import * as cheerio from "cheerio"
import { v4 as uuidv4 } from "uuid"

const parser = new Parser()

const DEFAULT_RSS_FEEDS = [
  "https://feeds.reuters.com/reuters/topNews",
  "https://rss.cnn.com/rss/edition.rss",
  "https://feeds.bbci.co.uk/news/rss.xml",
  "https://feeds.npr.org/1001/rss.xml",
  "https://feeds.washingtonpost.com/rss/world",
]

export async function fetchNewsFromRSS(feedUrls = DEFAULT_RSS_FEEDS, maxArticles = 50) {
  const articles = []

  try {
    for (const feedUrl of feedUrls) {
      console.log(`Fetching from RSS feed: ${feedUrl}`)

      try {
        const feed = await parser.parseURL(feedUrl)
        const feedArticles = feed.items.slice(0, Math.ceil(maxArticles / feedUrls.length))

        for (const item of feedArticles) {
          const article = {
            id: uuidv4(),
            title: item.title || "No title",
            content: item.contentSnippet || item.content || item.summary || "",
            url: item.link || "",
            publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
            source: feed.title || feedUrl,
            summary: item.contentSnippet || "",
          }

          // Try to fetch full article content if available
          if (article.url && article.content.length < 200) {
            try {
              const fullContent = await fetchFullArticleContent(article.url)
              if (fullContent) {
                article.content = fullContent
                article.summary = article.content.substring(0, 300) + "..."
              }
            } catch (error) {
              console.log(`Could not fetch full content for: ${article.url}`)
            }
          }

          articles.push(article)

          if (articles.length >= maxArticles) {
            break
          }
        }
      } catch (feedError) {
        console.error(`Error fetching from feed ${feedUrl}:`, feedError.message)
      }

      if (articles.length >= maxArticles) {
        break
      }
    }

    console.log(`Fetched ${articles.length} articles from RSS feeds`)
    return articles
  } catch (error) {
    console.error("Error fetching news from RSS:", error)
    throw error
  }
}

async function fetchFullArticleContent(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NewsBot/1.0)",
      },
    })

    const $ = cheerio.load(response.data)

    // Remove unwanted elements
    $("script, style, nav, header, footer, aside, .advertisement, .ads").remove()

    // Try common article selectors
    const selectors = [
      "article",
      ".article-content",
      ".story-body",
      ".entry-content",
      ".post-content",
      ".content",
      "main",
      ".article-body",
      ".story-content",
    ]

    let content = ""
    for (const selector of selectors) {
      const element = $(selector)
      if (element.length > 0) {
        content = element.text().trim()
        if (content.length > 100) {
          break
        }
      }
    }

    // Fallback to paragraphs
    if (!content || content.length < 100) {
      content = $("p")
        .map((i, el) => $(el).text().trim())
        .get()
        .join(" ")
    }

    // Clean up content
    content = content.replace(/\s+/g, " ").replace(/\n+/g, " ").trim()

    return content.length > 100 ? content : null
  } catch (error) {
    return null
  }
}

export function cleanArticleContent(content) {
  return content
    .replace(/\s+/g, " ")
    .replace(/[^\w\s.,!?;:()\-"']/g, "")
    .trim()
    .substring(0, 2000) // Limit content length
}

export function createArticleSummary(content, maxLength = 300) {
  const sentences = content.split(/[.!?]+/)
  let summary = ""

  for (const sentence of sentences) {
    if (summary.length + sentence.length > maxLength) {
      break
    }
    summary += sentence.trim() + ". "
  }

  return summary.trim()
}
