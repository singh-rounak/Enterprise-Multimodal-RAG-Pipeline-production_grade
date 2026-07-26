from fastapi import APIRouter, Depends

from app.core.dependencies import (
    get_embedding_service,
    get_llm_service,
    get_vector_store,
)
from app.schemas.health import HealthResponse
from app.services.embedding_service import EmbeddingService
from app.services.llm_service import LLMService
from app.services.vector_store import VectorStore

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Application health",
)
def health(
    embedding_service: EmbeddingService = Depends(get_embedding_service),
    vector_store: VectorStore = Depends(get_vector_store),
    llm_service: LLMService = Depends(get_llm_service),
):
    vector_store_healthy = vector_store.health()
    llm_healthy = llm_service.health()

    overall_status = "ok" if (vector_store_healthy and llm_healthy) else "degraded"

    return HealthResponse(
        status=overall_status,
        embedding_model=embedding_service.model_name,
        vector_store_healthy=vector_store_healthy,
        llm_model=llm_service.model,
        llm_healthy=llm_healthy,
    )
