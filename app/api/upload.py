from fastapi import APIRouter, Depends, File, UploadFile

from app.core.dependencies import get_ingestion_service
from app.schemas.upload import UploadResponse
from app.services.ingestion_service import IngestionService

router = APIRouter()


@router.post(
    "/upload",
    response_model=UploadResponse,
    summary="Upload and index a document",
)
async def upload_document(
    file: UploadFile = File(...),
    ingestion_service: IngestionService = Depends(get_ingestion_service),
):
    """
    Uploads a document, extracts its text, chunks it, embeds the chunks,
    and stores them in the vector store.

    Errors (unsupported file type, empty file, parsing failure, embedding
    failure, vector store failure) are handled by the registered exception
    handlers in app.core.exceptions, so we let them propagate here.
    """

    chunks = await ingestion_service.ingest(file)

    return UploadResponse(
        message=f"{file.filename} uploaded and indexed successfully.",
        chunks=chunks,
    )
