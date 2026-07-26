from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from datetime import datetime

from app.core.dependencies import get_ingestion_service, get_vector_store
from app.schemas.upload import UploadResponse, DocumentListResponse, DocumentInfo
from app.services.ingestion_service import IngestionService
from app.services.vector_store import VectorStore

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


@router.get(
    "/documents",
    response_model=DocumentListResponse,
    summary="List all indexed documents",
)
async def list_documents(
    vector_store: VectorStore = Depends(get_vector_store),
):
    """
    Returns a list of all indexed documents with their chunk counts and sizes.
    """
    docs = vector_store.list_documents()
    
    return DocumentListResponse(
        documents=[
            DocumentInfo(
                filename=doc["filename"],
                extension=doc["filename"].split(".")[-1] if "." in doc["filename"] else "",
                chunks=doc["chunks"],
                size=doc["size"],
                uploadedAt=datetime.utcnow().isoformat() + "Z",  # placeholder
            )
            for doc in docs
        ]
    )


@router.delete(
    "/documents/{filename}",
    summary="Delete a document by filename",
)
async def delete_document(
    filename: str,
    vector_store: VectorStore = Depends(get_vector_store),
):
    """
    Deletes all chunks associated with a document from the vector store.
    """
    deleted = vector_store.delete_by_source_file(filename)
    
    if deleted == 0:
        raise HTTPException(status_code=404, detail=f"Document '{filename}' not found")
    
    return {"message": f"Document '{filename}' deleted successfully", "deleted_chunks": deleted}