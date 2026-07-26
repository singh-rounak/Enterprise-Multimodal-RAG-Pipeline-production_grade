from uuid import uuid4
from typing import List

from qdrant_client import QdrantClient
from qdrant_client.models import (
    CollectionStatus,
    Distance,
    PointStruct,
    VectorParams,
)

from app.core.config import settings
from app.core.exceptions import VectorStoreException
from app.core.logging import logger


class VectorStore:
    """
    Handles all interactions with Qdrant.

    Responsibilities:
    - Create collection
    - Insert vectors
    - Search vectors
    - Delete vectors
    - Health check
    """

    def __init__(self):
        self.collection_name = settings.qdrant_collection

        try:
            self.client = QdrantClient(
                host=settings.qdrant_host,
                port=settings.qdrant_port,
            )
            self._ensure_collection()
        except Exception as exc:
            logger.exception("Failed to connect to Qdrant.")
            raise VectorStoreException(
                f"Could not connect to Qdrant at "
                f"{settings.qdrant_host}:{settings.qdrant_port}: {exc}"
            ) from exc

    def _ensure_collection(self):
        """
        Creates the collection if it doesn't exist.
        """

        collections = self.client.get_collections().collections
        existing = [c.name for c in collections]

        if self.collection_name not in existing:

            logger.info(
                f"Creating Qdrant collection '{self.collection_name}'"
            )

            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=settings.embedding_dimension,
                    distance=Distance.COSINE,
                ),
            )

    def upsert(
        self,
        texts: List[str],
        embeddings: List[List[float]],
        metadata: List[dict] | None = None,
    ):
        """
        Store document chunks and embeddings.
        """

        if metadata is None:
            metadata = [{} for _ in texts]

        points = []

        for text, vector, meta in zip(texts, embeddings, metadata):

            payload = {
                "text": text,
                **meta,
            }

            points.append(
                PointStruct(
                    id=str(uuid4()),
                    vector=vector,
                    payload=payload,
                )
            )

        try:
            self.client.upsert(
                collection_name=self.collection_name,
                points=points,
                wait=True,
            )
        except Exception as exc:
            logger.exception("Failed to upsert vectors into Qdrant.")
            raise VectorStoreException(f"Failed to store vectors: {exc}") from exc

        logger.info(f"Stored {len(points)} vectors.")

    def search(
        self,
        embedding: List[float],
        limit: int = None,
    ) -> List[str]:
        """
        Search similar document chunks.
        """

        if limit is None:
            limit = settings.retrieval_top_k

        try:
            response = self.client.query_points(
                collection_name=self.collection_name,
                query=embedding,
                limit=limit,
                with_payload=True,
            )
        except Exception as exc:
            logger.exception("Vector search failed.")
            raise VectorStoreException(f"Vector search failed: {exc}") from exc

        return [
            hit.payload["text"]
            for hit in response.points
            if hit.payload and "text" in hit.payload
        ]

    def delete_all(self):
        """
        Delete all vectors in the collection.
        """

        self.client.delete_collection(
            collection_name=self.collection_name
        )

        self._ensure_collection()

        logger.warning("Collection reset.")

    def health(self) -> bool:
        """
        Check Qdrant connectivity.
        """

        try:
            self.client.get_collection(
                self.collection_name
            )
            return True

        except Exception:

            logger.exception("Qdrant unavailable.")
            return False