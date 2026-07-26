from __future__ import annotations

from typing import List

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.logging import logger


class ChunkingService:
    """
    Handles splitting documents into chunks.

    Supported strategies:
        - Recursive Character (default)
        - Fixed Character
        - Markdown (future)
        - Semantic (future)
    """

    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        self.recursive_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=[
                "\n\n",
                "\n",
                ". ",
                "? ",
                "! ",
                ", ",
                " ",
                "",
            ],
        )

    def recursive_chunk(self, text: str) -> List[str]:
        """
        Recommended chunking strategy.
        """

        if not text:
            return []

        chunks = self.recursive_splitter.split_text(text)

        logger.info(f"Generated {len(chunks)} chunks.")

        return chunks

    def fixed_chunk(self, text: str) -> List[str]:
        """
        Fixed-size chunking.
        Mostly useful for debugging.
        """

        if not text:
            return []

        chunks = []

        step = self.chunk_size - self.chunk_overlap

        for i in range(0, len(text), step):
            chunks.append(text[i:i + self.chunk_size])

        logger.info(f"Generated {len(chunks)} chunks.")

        return chunks

    def markdown_chunk(self, markdown: str) -> List[str]:
        """
        Placeholder for Markdown-aware chunking.
        """

        return self.recursive_chunk(markdown)

    def semantic_chunk(self, text: str) -> List[str]:
        """
        Placeholder for semantic chunking.

        Will be implemented later using
        LangChain SemanticChunker.
        """

        return self.recursive_chunk(text)