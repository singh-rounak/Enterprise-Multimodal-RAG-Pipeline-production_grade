from __future__ import annotations

from pathlib import Path

from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import DocumentProcessingException
from app.core.logging import logger
from app.services.chunking_service import ChunkingService
from app.services.document_loader import DocumentLoader
from app.services.embedding_service import EmbeddingService
from app.services.vector_store import VectorStore


class IngestionService:
    """
    Orchestrates the document ingestion pipeline:

        raw upload -> DocumentLoader -> ChunkingService
                   -> EmbeddingService -> VectorStore
    """

    def __init__(
        self,
        document_loader: DocumentLoader,
        chunking_service: ChunkingService,
        embedding_service: EmbeddingService,
        vector_store: VectorStore,
    ):
        self.document_loader = document_loader
        self.chunking_service = chunking_service
        self.embedding_service = embedding_service
        self.vector_store = vector_store

        self.upload_dir = Path(settings.upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def ingest(self, file: UploadFile) -> int:
        """
        Saves the uploaded file to disk, extracts its text, chunks it,
        embeds the chunks, and stores them in the vector store.

        Returns the number of chunks indexed.
        """

        if not file.filename:
            raise DocumentProcessingException("Uploaded file has no filename.")

        extension = Path(file.filename).suffix.lower()

        if extension not in DocumentLoader.SUPPORTED_EXTENSIONS:
            raise DocumentProcessingException(
                f"Unsupported file type '{extension}'. "
                f"Supported types: {sorted(DocumentLoader.SUPPORTED_EXTENSIONS)}"
            )

        upload_path = self.upload_dir / file.filename

        content = await file.read()

        if not content:
            raise DocumentProcessingException(f"{file.filename} is empty.")

        max_bytes = settings.max_upload_size_mb * 1024 * 1024
        if len(content) > max_bytes:
            raise DocumentProcessingException(
                f"{file.filename} exceeds the {settings.max_upload_size_mb}MB upload limit."
            )

        with open(upload_path, "wb") as f:
            f.write(content)

        logger.info(f"Saved upload: {upload_path}")

        try:
            document = self.document_loader.load(upload_path)
        except ValueError as exc:
            raise DocumentProcessingException(str(exc)) from exc

        text = document.get("text", "")

        if not text.strip():
            raise DocumentProcessingException(
                f"No extractable text found in {file.filename}."
            )

        chunks = self.chunking_service.recursive_chunk(text)

        if not chunks:
            raise DocumentProcessingException(
                f"Chunking produced no chunks for {file.filename}."
            )

        embeddings = self.embedding_service.embed_documents(chunks)

        metadata = [
            {
                "source_file": file.filename,
                "chunk_index": index,
            }
            for index in range(len(chunks))
        ]

        self.vector_store.upsert(chunks, embeddings, metadata)

        logger.info(f"Indexed {len(chunks)} chunks from {file.filename}")

        return len(chunks)
