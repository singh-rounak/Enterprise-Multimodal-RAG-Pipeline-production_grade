import asyncio
import json
from typing import AsyncGenerator, Dict, List, Tuple

from app.core.exceptions import RetrievalException
from app.schemas.chat import Citation


class RAGService:
    """
    Orchestrates the retrieval-augmented generation flow:
    embed question -> retrieve context with citations -> prompt LLM -> return/stream answer.
    """

    def __init__(self, embedding_service, vector_store, llm_service):
        self.embedding_service = embedding_service
        self.vector_store = vector_store
        self.llm_service = llm_service

    def _prepare_context_and_citations(self, question: str) -> Tuple[str, List[Citation]]:
        if not question or not question.strip():
            raise RetrievalException("Question must not be empty.")

        embedding = self.embedding_service.get_embed(question)
        search_hits = self.vector_store.search_with_metadata(embedding)

        if not search_hits:
            return "", []

        context_blocks = []
        citations = []
        for idx, hit in enumerate(search_hits):
            block = f"[Source {idx+1}: {hit['source_file']} (Page {hit['page']})]\n{hit['text']}"
            context_blocks.append(block)
            citations.append(
                Citation(
                    source_file=hit["source_file"],
                    page=hit["page"],
                    chunk_index=hit["chunk_index"],
                    score=hit["score"],
                    snippet=hit["text"][:300] + ("..." if len(hit["text"]) > 300 else ""),
                )
            )

        context_str = "\n\n".join(context_blocks)
        return context_str, citations

    def _build_prompt(self, context: str, question: str) -> str:
        return f"""You are a precise enterprise document assistant. Answer the user's question accurately using ONLY the context provided below.
If the answer cannot be found in the context, explicitly state "I couldn't find enough relevant information in the uploaded documents to answer that question."

Context:
{context}

Question:
{question}

Answer:"""

    def answer_with_citations(self, question: str) -> Tuple[str, List[Citation]]:
        context, citations = self._prepare_context_and_citations(question)

        if not context:
            return (
                "I couldn't find anything relevant in the uploaded documents to answer that question.",
                [],
            )

        prompt = self._build_prompt(context, question)
        answer = self.llm_service.generate_response(prompt)
        return answer, citations

    def answer(self, question: str) -> str:
        answer_str, _ = self.answer_with_citations(question)
        return answer_str

    async def stream_answer(self, question: str) -> AsyncGenerator[str, None]:
        """
        SSE Generator pattern:
        1. Yields initial JSON event containing citations metadata: data: {"event": "citations", "citations": [...]}
        2. Yields token events: data: {"event": "token", "content": "..."}
        3. Yields final completion event: data: {"event": "done"}
        """
        # Run embedding and search in thread pool to prevent event loop blocking
        context, citations = await asyncio.to_thread(self._prepare_context_and_citations, question)

        if not context:
            citations_event = json.dumps({"event": "citations", "citations": []})
            yield f"data: {citations_event}\n\n"
            token_event = json.dumps({
                "event": "token",
                "content": "I couldn't find anything relevant in the uploaded documents to answer that question."
            })
            yield f"data: {token_event}\n\n"
            yield f"data: {json.dumps({'event': 'done'})}\n\n"
            return

        citations_payload = [c.model_dump() for c in citations]
        yield f"data: {json.dumps({'event': 'citations', 'citations': citations_payload})}\n\n"

        prompt = self._build_prompt(context, question)

        async for token in self.llm_service.generate_response_stream(prompt):
            token_data = json.dumps({"event": "token", "content": token})
            yield f"data: {token_data}\n\n"

        yield f"data: {json.dumps({'event': 'done'})}\n\n"

