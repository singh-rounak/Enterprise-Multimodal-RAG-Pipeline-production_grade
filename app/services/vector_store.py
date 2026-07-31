from uuid import uuid4
from typing import List
from collections import defaultdict

from qdrant_client import QdrantClient
from qdrant_client.models import (
    CollectionStatus,
    Distance,
    PointStruct,
    VectorParams,
    Filter,
    FieldCondition,
    MatchValue,
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
        Search similar document chunks (returns text strings).
        """
        hits = self.search_with_metadata(embedding, limit=limit)
        return [hit["text"] for hit in hits]

    def search_with_metadata(
        self,
        embedding: List[float],
        limit: int = None,
    ) -> List[dict]:
        """
        Search similar document chunks and return full metadata + similarity score.
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

        results = []
        for hit in response.points:
            if hit.payload and "text" in hit.payload:
                results.append({
                    "text": hit.payload["text"],
                    "source_file": hit.payload.get("source_file", "Unknown"),
                    "page": hit.payload.get("page", 1),
                    "chunk_index": hit.payload.get("chunk_index", 0),
                    "score": round(float(hit.score), 4) if hasattr(hit, "score") and hit.score is not None else 0.0,
                })
        return results


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

    def list_documents(self) -> List[dict]:
        """
        List all unique documents with their chunk counts.
        """
        try:
            # Scroll through all points to get document metadata
            documents = defaultdict(lambda: {"chunks": 0, "size": 0})
            
            offset = None
            while True:
                response = self.client.scroll(
                    collection_name=self.collection_name,
                    limit=100,
                    offset=offset,
                    with_payload=True,
                    with_vectors=False,
                )
                points, offset = response
                
                for point in points:
                    if point.payload and "source_file" in point.payload:
                        filename = point.payload["source_file"]
                        documents[filename]["chunks"] += 1
                        if "text" in point.payload:
                            documents[filename]["size"] += len(point.payload["text"])
                
                if offset is None:
                    break
            
            return [
                {
                    "filename": filename,
                    "chunks": info["chunks"],
                    "size": info["size"],
                }
                for filename, info in documents.items()
            ]
        except Exception as exc:
            logger.exception("Failed to list documents.")
            raise VectorStoreException(f"Failed to list documents: {exc}") from exc

    def delete_by_source_file(self, filename: str) -> int:
        """
        Delete all vectors for a specific source file.
        Returns the number of deleted points.
        """
        try:
            filter_condition = Filter(
                must=[
                    FieldCondition(
                        key="source_file",
                        match=MatchValue(value=filename),
                    )
                ]
            )
            
            result = self.client.delete(
                collection_name=self.collection_name,
                points_selector=filter_condition,
                wait=True,
            )
            
            logger.info(f"Deleted {result.operation_id} points for {filename}")
            return result.operation_id or 0
        except Exception as exc:
            logger.exception(f"Failed to delete document {filename}.")
            raise VectorStoreException(f"Failed to delete document: {exc}") from exc