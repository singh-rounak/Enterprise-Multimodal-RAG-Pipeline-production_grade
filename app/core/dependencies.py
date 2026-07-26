from functools import lru_cache

from app.services.chunking_service import ChunkingService
from app.services.document_loader import DocumentLoader
from app.services.embedding_service import EmbeddingService
from app.services.ingestion_service import IngestionService
from app.services.llm_service import LLMService
from app.services.rag_service import RAGService
from app.services.vector_store import VectorStore


@lru_cache
def get_embedding_service() -> EmbeddingService:
    """Cached EmbeddingService instance (loads the model once)."""
    return EmbeddingService()


@lru_cache
def get_vector_store() -> VectorStore:
    """Cached VectorStore instance (single Qdrant client/connection)."""
    return VectorStore()


@lru_cache
def get_llm_service() -> LLMService:
    """Cached LLMService instance."""
    return LLMService()


@lru_cache
def get_document_loader() -> DocumentLoader:
    """Cached DocumentLoader instance."""
    return DocumentLoader()


@lru_cache
def get_chunking_service() -> ChunkingService:
    """Cached ChunkingService instance."""
    return ChunkingService()


@lru_cache
def get_ingestion_service() -> IngestionService:
    """
    Cached IngestionService instance, wired with the document loader,
    chunking service, embedding service, and vector store.
    """
    return IngestionService(
        document_loader=get_document_loader(),
        chunking_service=get_chunking_service(),
        embedding_service=get_embedding_service(),
        vector_store=get_vector_store(),
    )


@lru_cache
def get_rag_service() -> RAGService:
    """Cached RAGService instance."""
    return RAGService(
        embedding_service=get_embedding_service(),
        vector_store=get_vector_store(),
        llm_service=get_llm_service(),
    )
