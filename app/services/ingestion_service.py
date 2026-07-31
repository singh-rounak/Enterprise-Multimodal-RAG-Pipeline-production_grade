import asyncio
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
    Orchestrates the document ingestion pipeline asynchronously:

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

    def _process_file_sync(self, upload_path: Path, filename: str):
        """Synchronous CPU worker run in thread pool."""
        try:
            document = self.document_loader.load(upload_path)
        except ValueError as exc:
            raise DocumentProcessingException(str(exc)) from exc

        pages = document.get("pages", [])
        all_chunks = []
        all_metadata = []
        global_chunk_idx = 0

        if pages:
            for page_item in pages:
                page_num = page_item.get("page", 1)
                page_text = page_item.get("text", "")
                if not page_text.strip():
                    continue

                page_chunks = self.chunking_service.recursive_chunk(page_text)
                for chunk in page_chunks:
                    all_chunks.append(chunk)
                    all_metadata.append({
                        "source_file": filename,
                        "page": page_num,
                        "chunk_index": global_chunk_idx,
                    })
                    global_chunk_idx += 1
        else:
            text = document.get("text", "")
            if not text.strip():
                raise DocumentProcessingException(f"No extractable text found in {filename}.")
            chunks = self.chunking_service.recursive_chunk(text)
            for idx, chunk in enumerate(chunks):
                all_chunks.append(chunk)
                all_metadata.append({
                    "source_file": filename,
                    "page": 1,
                    "chunk_index": idx,
                })

        if not all_chunks:
            raise DocumentProcessingException(f"Chunking produced no chunks for {filename}.")

        embeddings = self.embedding_service.embed_documents(all_chunks)
        self.vector_store.upsert(all_chunks, embeddings, all_metadata)
        return len(all_chunks)

    async def ingest(self, file: UploadFile) -> int:
        """
        Saves the uploaded file to disk and offloads parsing & embedding to a background thread.
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

        chunk_count = await asyncio.to_thread(self._process_file_sync, upload_path, file.filename)
        logger.info(f"Indexed {chunk_count} chunks from {file.filename}")
        return chunk_count

