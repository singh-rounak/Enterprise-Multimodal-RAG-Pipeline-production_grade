from fastapi import Request, status
from fastapi.responses import JSONResponse

from app.core.logging import logger


# ============================================================
# Custom Exceptions
# ============================================================

class VectorMindException(Exception):
    """Base exception for the application."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class DocumentProcessingException(VectorMindException):
    """Raised when document parsing or loading fails."""
    pass


class UnsupportedFileTypeException(DocumentProcessingException):
    """Raised for unsupported document types."""
    pass


class EmbeddingException(VectorMindException):
    """Raised when embedding generation fails."""
    pass


class VectorStoreException(VectorMindException):
    """Raised for Qdrant-related failures."""
    pass


class LLMException(VectorMindException):
    """Raised when the LLM is unavailable or generation fails."""
    pass


class RetrievalException(VectorMindException):
    """Raised during vector retrieval."""
    pass


# ============================================================
# Exception Handlers
# ============================================================

async def document_exception_handler(
    request: Request,
    exc: DocumentProcessingException,
):
    logger.exception(exc)

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "success": False,
            "error": "Document Processing Error",
            "message": exc.message,
        },
    )


async def embedding_exception_handler(
    request: Request,
    exc: EmbeddingException,
):
    logger.exception(exc)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Embedding Error",
            "message": exc.message,
        },
    )


async def vectorstore_exception_handler(
    request: Request,
    exc: VectorStoreException,
):
    logger.exception(exc)

    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "success": False,
            "error": "Vector Store Error",
            "message": exc.message,
        },
    )


async def llm_exception_handler(
    request: Request,
    exc: LLMException,
):
    logger.exception(exc)

    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "success": False,
            "error": "LLM Error",
            "message": exc.message,
        },
    )


async def retrieval_exception_handler(
    request: Request,
    exc: RetrievalException,
):
    logger.exception(exc)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Retrieval Error",
            "message": exc.message,
        },
    )


async def generic_exception_handler(
    request: Request,
    exc: Exception,
):
    logger.exception(exc)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Internal Server Error",
            "message": "An unexpected error occurred.",
        },
    )