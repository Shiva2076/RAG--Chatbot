# RAG Chatbot Backend

A Node.js backend service for a RAG-powered chatbot that answers queries over news articles.

## Features

- **RAG Pipeline**: Retrieval-Augmented Generation using Jina Embeddings and Qdrant vector database
- **Real-time Chat**: WebSocket support for live messaging
- **Session Management**: Redis-based session handling with TTL
- **News Ingestion**: Automated RSS feed processing and article embedding
- **Caching**: Multi-layer caching for performance optimization

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Real-time**: Socket.IO
- **Vector DB**: Qdrant
- **Cache**: Redis
- **Embeddings**: Jina AI API
- **LLM**: Google Gemini API

## Setup

1. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Environment Configuration**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   \`\`\`

3. **Start Services**
   \`\`\`bash
   # Start Redis (using Docker)
   docker run -d -p 6379:6379 redis:alpine
   
   # Start Qdrant (using Docker)
   docker run -d -p 6333:6333 qdrant/qdrant
   \`\`\`

4. **Ingest News Data**
   \`\`\`bash
   npm run ingest
   \`\`\`

5. **Start Server**
   \`\`\`bash
   npm run dev
   \`\`\`

## API Endpoints

### Chat
- `POST /api/chat/message` - Send message and get response
- `POST /api/chat/stream` - Stream response in real-time

### Session
- `POST /api/session/create` - Create new session
- `GET /api/session/:id/history` - Get chat history
- `DELETE /api/session/:id/clear` - Clear session

### RAG
- `POST /api/rag/search` - Search similar documents
- `GET /api/rag/status` - Get ingestion status

## Caching Strategy

### Redis Configuration
- **Chat History TTL**: 1 hour (configurable)
- **Session TTL**: 1 hour (configurable)
- **Embedding Cache**: 24 hours for repeated queries

### Cache Warming
\`\`\`javascript
// Warm cache with popular queries
const popularQueries = [
  "latest news",
  "breaking news today",
  "technology updates"
];

// Pre-compute embeddings for common queries
await warmEmbeddingCache(popularQueries);
\`\`\`

### Performance Optimizations
- Batch embedding generation (10 articles per batch)
- Connection pooling for Redis and Qdrant
- Response compression
- Query result caching

## Deployment

### Docker
\`\`\`bash
docker build -t rag-chatbot-backend .
docker run -p 5000:5000 rag-chatbot-backend
\`\`\`

### Environment Variables
\`\`\`env
PORT=5000
REDIS_URL=redis://localhost:6379
QDRANT_URL=http://localhost:6333
GEMINI_API_KEY=your_gemini_key
JINA_API_KEY=your_jina_key
\`\`\`

## Architecture

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Vector DB     │
│   (React)       │◄──►│   (Express)     │◄──►│   (Qdrant)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Cache         │
                       │   (Redis)       │
                       └─────────────────┘
\`\`\`

## News Sources

Default RSS feeds include:
- Reuters Top News
- CNN RSS
- BBC News
- NPR News
- Washington Post World

## Monitoring

Health check endpoint: `GET /health`

Response:
\`\`\`json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
