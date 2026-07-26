from __future__ import annotations

from app.core.exceptions import RetrievalException


class RAGService:
    """
    Orchestrates the retrieval-augmented generation flow:
    embed question -> retrieve context -> prompt LLM -> return answer.
    """

    def __init__(self, embedding_service, vector_store, llm_service):
        self.embedding_service = embedding_service
        self.vector_store = vector_store
        self.llm_service = llm_service

    def answer(self, question: str) -> str:
        if not question or not question.strip():
            raise RetrievalException("Question must not be empty.")

        # Generate an embedding for the question using the embedding service
        embedding = self.embedding_service.get_embed(question)

        # Search for relevant context in the vector store using the generated embedding
        context_chunks = self.vector_store.search(embedding)

        if not context_chunks:
            return (
                "I couldn't find anything relevant in the uploaded documents "
                "to answer that question."
            )

        context = "\n\n".join(context_chunks)

        prompt = f"""Answer the user's question using only the context below.
If the answer isn't contained in the context, say you don't know.

Context:
{context}

Question:
{question}
"""

        # Generate a response using the LLM
        return self.llm_service.generate_response(prompt)
