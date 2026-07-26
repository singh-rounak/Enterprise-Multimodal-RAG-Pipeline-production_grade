from pydantic import BaseModel
from typing import List


class UploadResponse(BaseModel):
    message: str
    chunks: int


class DocumentInfo(BaseModel):
    filename: str
    extension: str
    chunks: int
    size: int
    uploadedAt: str


class DocumentListResponse(BaseModel):
    documents: List[DocumentInfo]