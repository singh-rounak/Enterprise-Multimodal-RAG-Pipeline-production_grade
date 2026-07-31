from typing import List, Optional
from pydantic import BaseModel


class Citation(BaseModel):
    source_file: str
    page: Optional[int] = None
    chunk_index: Optional[int] = None
    score: float = 0.0
    snippet: str


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str
    citations: List[Citation] = []