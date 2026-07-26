from __future__ import annotations

from sentence_transformers import SentenceTransformer

from app.core.config import settings
from app.core.exceptions import EmbeddingException
from app.core.logging import logger


class EmbeddingService:
    """
    Handles the embedding model for generating vector representations of text.
    """

    def __init__(self):
        self.model_name = settings.embedding_model

        try:
            self.model = SentenceTransformer(self.model_name)
        except Exception as exc:
            logger.exception("Failed to load embedding model.")
            raise EmbeddingException(
                f"Could not load embedding model '{self.model_name}': {exc}"
            ) from exc

    def get_embed(self, text: str) -> list[float]:
        """
        Generates an embedding for the given text.
        """
        try:
            return self.model.encode(text).tolist()
        except Exception as exc:
            logger.exception("Embedding generation failed.")
            raise EmbeddingException(f"Failed to embed text: {exc}") from exc

    def embed_documents(self, documents: list[str]) -> list[list[float]]:
        """
        Generates embeddings for a batch of document chunks.
        """
        if not documents:
            return []

        try:
            return self.model.encode(documents).tolist()
        except Exception as exc:
            logger.exception("Batch embedding generation failed.")
            raise EmbeddingException(f"Failed to embed documents: {exc}") from exc
