from pydantic import BaseModel


class UploadResponse(BaseModel):
    message: str
    chunks: int