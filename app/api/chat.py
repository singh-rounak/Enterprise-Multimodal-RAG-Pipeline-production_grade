from fastapi import APIRouter, Depends

from app.core.dependencies import get_rag_service
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.rag_service import RAGService

router = APIRouter()


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Ask questions about uploaded documents"
)
async def chat(
    request: ChatRequest,
    rag_service: RAGService = Depends(get_rag_service)
):

    answer = rag_service.answer(request.question)

    return ChatResponse(
        answer=answer
    )