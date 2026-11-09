from __future__ import annotations

import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.schemas import ChatRequest, ChatResponse
from app.services.openai_service import stream_chat_completion
from app.services.rag_service import (
    answer_query,
    build_rag_messages,
    retrieve_relevant_chunks,
)

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    RAG-powered chat endpoint.
    Retrieves relevant document chunks from PostgreSQL pgvector and queries OpenAI.
    Supports both standard JSON and Server-Sent Events (SSE) streaming.
    """
    top_k = request.top_k or settings.TOP_K

    try:
        if not request.stream:
            answer, sources = await answer_query(
                db=db,
                query=request.message,
                history=request.history,
                top_k=top_k,
            )
            return ChatResponse(answer=answer, sources=sources)

        # Streaming mode via SSE
        sources = await retrieve_relevant_chunks(db=db, query=request.message, top_k=top_k)
        messages = build_rag_messages(request.message, sources, request.history)

        async def event_generator():
            # Send retrieved sources metadata first
            sources_payload = [s.model_dump() for s in sources]
            yield f"data: {json.dumps({'type': 'sources', 'data': sources_payload})}\n\n"

            # Stream response tokens
            async for token in stream_chat_completion(messages):
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

            yield "data: [DONE]\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during chat generation: {str(e)}",
        )


@router.post("/stream")
async def chat_stream_route(
    request: dict,
    db: AsyncSession = Depends(get_db),
):
    """
    Direct streaming endpoint matching /chat/stream.
    """
    from main import chat_stream, ChatStreamQueryRequest
    query = request.get("query", "")
    top_k = request.get("top_k", 4)
    return await chat_stream(ChatStreamQueryRequest(query=query, top_k=top_k), db=db)
