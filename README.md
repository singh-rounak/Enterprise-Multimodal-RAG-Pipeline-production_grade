# Enterprise Multimodal RAG Pipeline

A production-grade, 100% local Retrieval-Augmented Generation (RAG) pipeline with semantic chunking, hybrid retrieval, and cross-encoder reranking. Zero cloud dependencies, zero API costs.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Upload    │────▶│  Ingestion   │────▶│   Qdrant    │
│  (PDF/TXT/  │     │  Pipeline    │     │  Vector DB  │
│    MD)      │     │              │     │  (HNSW)     │
└─────────────┘     └──────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌──────────────┐     ┌─────────────┐
                    │  Embedding   │     │  Retrieval  │
                    │  (MiniLM)    │     │  (Dense +   │
                    └──────────────┘     │   Sparse)   │
                                         └──────┬──────┘
                                                │
                           ┌──────────────┐     ▼
                           │   Ollama (phi3:mini) │◀───┘
                           └──────────────┘
```

## Features

- **Semantic Chunking**: Recursive character splitting with configurable overlap
- **Hybrid Retrieval**: Dense (cosine) + Sparse (BM25) via Qdrant
- **Cross-Encoder Reranking**: BAAI/bge-reranker-large for precision
- **100% Local**: Ollama for LLM, SentenceTransformers for embeddings
- **Production Ready**: Docker Compose, health checks, structured logging

## Quick Start

### Prerequisites
- Docker & Docker Compose
- 4GB+ RAM (for phi3:mini)

### Run with Docker Compose
```bash
git clone <repo>
cd Enterprise-Multimodal-RAG-Pipeline-production_grade
docker compose up -d
```

Services:
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Qdrant**: http://localhost:6333
- **Ollama**: http://localhost:11434

### Frontend (Optional)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at http://localhost:5173 (proxies API to backend)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | System health check |
| POST | `/api/v1/upload` | Upload & index document |
| GET | `/api/v1/documents` | List indexed documents |
| DELETE | `/api/v1/documents/{filename}` | Delete document |
| POST | `/api/v1/chat` | Ask question (RAG) |

### Example Usage
```bash
# Upload document
curl -X POST http://localhost:8000/api/v1/upload \
  -F "file=@document.pdf"

# List documents
curl http://localhost:8000/api/v1/documents

# Ask question
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the main topic?"}'
```

## Configuration

Environment variables (`.env`):
```bash
APP_NAME=VectorMind
APP_VERSION=2.0.0
ENVIRONMENT=development

OLLAMA_BASE_URL=http://localhost:11434
LLM_MODEL=phi3:mini

QDRANT_HOST=localhost
QDRANT_PORT=6333

EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| API | FastAPI, Uvicorn |
| Vector DB | Qdrant (HNSW) |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| LLM | Ollama (phi3:mini) |
| Chunking | LangChain RecursiveCharacterTextSplitter |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Orchestration | Docker Compose |

## Project Structure

```
├── app/
│   ├── api/           # FastAPI routes
│   ├── core/          # Config, exceptions, logging
│   ├── schemas/       # Pydantic models
│   └── services/      # Business logic
├── frontend/          # React + Vite + Tailwind
├── docker-compose.yml
├── Dockerfile
└── requirements.txt
```

## License

MIT