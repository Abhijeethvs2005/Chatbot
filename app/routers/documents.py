from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Document, DocumentChunk
from app.schemas import DocumentResponse
from app.services.openai_service import get_embeddings_batch
from app.services.pdf_service import chunk_text, extract_text_from_pdf

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_pdf(
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
):
    """Upload a PDF document, extract its text, generate embeddings, and store them with pgvector."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are currently supported.",
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty.",
        )

    # 1. Extract text
    try:
        extracted_text = extract_text_from_pdf(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to read and parse PDF: {str(e)}",
        )

    if not extracted_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No readable text found in the PDF.",
        )

    # 2. Chunk text
    chunks = chunk_text(extracted_text)
    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not generate chunks from the document.",
        )

    # 3. Create document record
    doc = Document(
        filename=file.filename,
        file_size=len(content),
        chunk_count=len(chunks),
    )
    db.add(doc)
    await db.flush()  # Populates doc.id

    # 4. Generate embeddings
    try:
        embeddings = await get_embeddings_batch(chunks)
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI embedding generation failed: {str(e)}",
        )

    # 5. Store chunks in database
    for idx, (chunk_str, emb) in enumerate(zip(chunks, embeddings)):
        db_chunk = DocumentChunk(
            document_id=doc.id,
            chunk_index=idx,
            content=chunk_str,
            embedding=emb,
        )
        db.add(db_chunk)

    await db.commit()
    await db.refresh(doc)
    return doc


@router.get("", response_model=list[DocumentResponse])
async def list_documents(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """List all indexed documents."""
    stmt = select(Document).offset(skip).limit(limit).order_by(Document.id.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve details for a specific document."""
    doc = await db.get(Document, document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found.",
        )
    return doc


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a document and all of its associated vector chunks."""
    doc = await db.get(Document, document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found.",
        )
    await db.delete(doc)
    await db.commit()
    return None
