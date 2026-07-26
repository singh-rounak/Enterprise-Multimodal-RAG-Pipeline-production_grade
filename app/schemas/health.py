from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    embedding_model: str
    vector_store_healthy: bool
    llm_model: str
    llm_healthy: bool
