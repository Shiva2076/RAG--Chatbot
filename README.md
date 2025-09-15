# RAG-Powered News Chatbot

A full-stack chatbot application that answers queries over news articles using Retrieval-Augmented Generation (RAG) pipeline.

## 🚀 Features

- **RAG Pipeline**: Ingests ~50 news articles, creates embeddings with Jina AI, stores in Qdrant vector database
- **Real-time Chat**: WebSocket-based chat interface with typing indicators
- **Session Management**: Redis-powered session handling with TTL
- **Performance Optimized**: Multi-layer caching, batch processing, compression
- **Modern UI**: React + Tailwind CSS with responsive design
- **Source Citations**: Displays relevant news sources with relevance scores

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Real-time**: Socket.IO
- **Vector DB**: Qdrant
- **Cache**: Redis
- **Embeddings**: Jina AI API
- **LLM**: Google Gemini API

### Frontend
- **Framework**: Next.js 14
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Real-time**: Socket.IO Client

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- API Keys: Jina AI, Google Gemini

### Quick Start with Docker

1. **Clone and Setup**
   \`\`\`bash
   git clone <repository-url>
   cd rag-chatbot
   \`\`\`

2. **Environment Configuration**
   \`\`\`bash
   # Backend environment
   cp server/.env.example server/.env
   # Edit server/.env with your API keys
   
   # Frontend environment
   echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
   \`\`\`

3. **Start Services**
   \`\`\`bash
   docker-compose up -d
   \`\`\`

4. **Ingest News Data**
   \`\`\`bash
   docker-compose exec backend npm run ingest
   \`\`\`

5. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Qdrant Dashboard: http://localhost:6333/dashboard

### Manual Setup

1. **Start Infrastructure**
   \`\`\`bash
   # Redis
   docker run -d -p 6379:6379 redis:alpine
   
   # Qdrant
   docker run -d -p 6333:6333 qdrant/qdrant
   \`\`\`

2. **Backend Setup**
   \`\`\`bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run ingest  # Ingest news articles
   npm run dev     # Start development server
   \`\`\`

3. **Frontend Setup**
   \`\`\`bash
   npm install
   echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
   npm run dev
   \`\`\`

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
\`\`\`env
# Server
PORT=5000
FRONTEND_URL=http://localhost:3000

# Redis
REDIS_URL=redis://localhost:6379

# Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_qdrant_api_key

# AI Services
GEMINI_API_KEY=your_gemini_api_key
JINA_API_KEY=your_jina_api_key

# News Sources
RSS_FEEDS=https://feeds.reuters.com/reuters/topNews,https://rss.cnn.com/rss/edition.rss

# Cache Configuration
CHAT_HISTORY_TTL=3600
EMBEDDING_CACHE_TTL=86400
\`\`\`

#### Frontend (.env.local)
\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:5000
\`\`\`

## 📊 Performance & Caching

### Caching Strategy
- **Embedding Cache**: 24-hour TTL for repeated text embeddings
- **Query Cache**: 1-hour TTL for complete query results
- **Search Cache**: 30-minute TTL for vector search results
- **Session Cache**: 1-hour TTL for chat history

### Cache Warming
\`\`\`bash
# Warm cache with popular queries
curl -X POST http://localhost:5000/api/cache/warm \
  -H "Content-Type: application/json" \
  -d '{"queries": ["latest news", "technology updates", "breaking news"]}'
\`\`\`

### Performance Monitoring
- Cache hit/miss statistics
- Response time tracking
- Real-time cache stats in development mode

## 🧪 Testing

### System Health Test
\`\`\`bash
cd server
node scripts/testSystem.js
\`\`\`

### Performance Test
\`\`\`bash
# Included in system test
npm run test
\`\`\`

## 🚀 Deployment

### Production with Docker
\`\`\`bash
# Build and deploy
docker-compose -f docker-compose.yml -f server/docker-compose.prod.yml up -d

# Ingest data
docker-compose exec backend npm run ingest
\`\`\`

### Render.com Deployment
1. Connect GitHub repository
2. Set environment variables
3. Deploy backend as Web Service
4. Deploy frontend as Static Site

### Vercel Deployment (Frontend)
\`\`\`bash
npm install -g vercel
vercel --prod
\`\`\`

## 📡 API Endpoints

### Chat
- \`POST /api/chat/message\` - Send message and get response
- \`POST /api/chat/stream\` - Stream response in real-time

### Session Management
- \`POST /api/session/create\` - Create new session
- \`GET /api/session/:id/history\` - Get chat history
- \`DELETE /api/session/:id/clear\` - Clear session

### RAG System
- \`POST /api/rag/search\` - Search similar documents
- \`GET /api/rag/status\` - Get ingestion status

### Cache Management
- \`GET /api/cache/stats\` - Get cache statistics
- \`DELETE /api/cache/clear/:type\` - Clear cache
- \`POST /api/cache/warm\` - Warm embedding cache

## 🏗 Architecture

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Vector DB     │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (Qdrant)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Cache         │    │   News Sources  │
                       │   (Redis)       │    │   (RSS Feeds)   │
                       └─────────────────┘    └─────────────────┘
\`\`\`

## 📝 Usage Examples

### Basic Chat
\`\`\`javascript
// Send message
const response = await fetch('/api/chat/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'session-123',
    message: 'What is the latest news about technology?'
  })
});

const data = await response.json();
console.log(data.content); // AI response
console.log(data.sources); // News sources
\`\`\`

### WebSocket Connection
\`\`\`javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');
socket.emit('join-session', sessionId);
socket.on('new-message', (message) => {
  console.log('New message:', message);
});
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit changes (\`git commit -m 'Add amazing feature'\`)
4. Push to branch (\`git push origin feature/amazing-feature\`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Jina AI](https://jina.ai/) for embeddings API
- [Qdrant](https://qdrant.tech/) for vector database
- [Google Gemini](https://ai.google.dev/) for language model
- [shadcn/ui](https://ui.shadcn.com/) for UI components
\`\`\`
