from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.chat import router as chat_router
from app.api.health import router as health_router
from app.api.upload import router as upload_router
from app.core.config import settings
from app.core.exceptions import (
    DocumentProcessingException,
    EmbeddingException,
    LLMException,
    RetrievalException,
    VectorStoreException,
    document_exception_handler,
    embedding_exception_handler,
    generic_exception_handler,
    llm_exception_handler,
    retrieval_exception_handler,
    vectorstore_exception_handler,
)
from app.core.logging import logger

# -----------------------------
# Initialize FastAPI app
# -----------------------------
app = FastAPI(
    title=settings.app_name,
    description="A RAG API for uploading Documents and asking questions.",
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
)

# -----------------------------
# CORS (for the React UI / any external client)
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Register API Routers
# -----------------------------
app.include_router(upload_router, prefix=settings.api_prefix, tags=["Upload"])
app.include_router(chat_router, prefix=settings.api_prefix, tags=["Chat"])
app.include_router(health_router, prefix=settings.api_prefix, tags=["Health"])

# -----------------------------
# Startup / Shutdown Events
# -----------------------------
@app.on_event("startup")
async def startup_event():
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    logger.info(f"{settings.app_name} v{settings.app_version} started successfully.")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info(f"{settings.app_name} shutting down.")


# -----------------------------
# Home route
# -----------------------------
@app.get("/", tags=["Home"])
async def root():
    return {
        "application": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "status": "running",
        "docs": "/docs",
    }


# -----------------------------
# Exception Handlers
# -----------------------------
app.add_exception_handler(DocumentProcessingException, document_exception_handler)
app.add_exception_handler(EmbeddingException, embedding_exception_handler)
app.add_exception_handler(VectorStoreException, vectorstore_exception_handler)
app.add_exception_handler(LLMException, llm_exception_handler)
app.add_exception_handler(RetrievalException, retrieval_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)
