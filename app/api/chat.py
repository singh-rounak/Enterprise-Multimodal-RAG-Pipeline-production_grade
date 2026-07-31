from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.core.dependencies import get_rag_service
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.rag_service import RAGService

router = APIRouter()


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Ask questions about uploaded documents (Non-streaming)"
)
async def chat(
    request: ChatRequest,
    rag_service: RAGService = Depends(get_rag_service)
):
    answer, citations = rag_service.answer_with_citations(request.question)

    return ChatResponse(
        answer=answer,
        citations=citations,
    )


@router.post(
    "/chat/stream",
    summary="Ask questions with real-time token streaming (Server-Sent Events)"
)
async def chat_stream(
    request: ChatRequest,
    rag_service: RAGService = Depends(get_rag_service)
):
    return StreamingResponse(
        rag_service.stream_answer(request.question),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )