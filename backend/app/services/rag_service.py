from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import Document, DocumentChunk
from app.schemas import ChatMessage, SourceChunk
from app.services.openai_service import (
    generate_chat_completion,
    get_embedding,
    stream_chat_completion,
)


async def retrieve_relevant_chunks(
    db: AsyncSession,
    query: str,
    top_k: int = settings.TOP_K,
) -> list[SourceChunk]:
    """Generate embedding for query and retrieve top_k most similar chunks from pgvector."""
    query_embedding = await get_embedding(query)

    distance_expr = DocumentChunk.embedding.cosine_distance(query_embedding).label("distance")

    stmt = (
        select(
            DocumentChunk,
            Document.filename,
            distance_expr,
        )
        .join(Document, DocumentChunk.document_id == Document.id)
        .order_by(distance_expr)
        .limit(top_k)
    )

    result = await db.execute(stmt)
    rows = result.all()

    sources: list[SourceChunk] = []
    for chunk, filename, distance in rows:
        # Distance ranges from 0 (identical) to 2 (opposite); cosine similarity ~ (1 - distance)
        similarity = max(0.0, float(1.0 - distance))
        sources.append(
            SourceChunk(
                document_id=chunk.document_id,
                filename=filename,
                chunk_index=chunk.chunk_index,
                content=chunk.content,
                score=round(similarity, 4),
            )
        )

    return sources


def build_rag_messages(
    query: str,
    sources: list[SourceChunk],
    history: list[ChatMessage],
) -> list[dict]:
    """Assemble context, system prompt, and conversation history into OpenAI messages format."""
    if sources:
        context_blocks = [
            f"[Source: {s.filename} | Chunk #{s.chunk_index}]\n{s.content}"
            for s in sources
        ]
        context_text = "\n\n---\n\n".join(context_blocks)
        system_content = (
            "You are an intelligent, helpful RAG chatbot. Use the following context retrieved from "
            "uploaded documents to answer the user's questions accurately and concisely.\n\n"
            "Guidelines:\n"
            "1. Answer based primarily on the provided context.\n"
            "2. If the context does not contain enough information to answer, acknowledge that honestly.\n"
            "3. Cite document sources and chunk references when helpful.\n\n"
            f"Context:\n{context_text}"
        )
    else:
        system_content = (
            "You are a helpful AI assistant. No document context was found for this query, "
            "so provide a helpful general response."
        )

    messages: list[dict] = [{"role": "system", "content": system_content}]

    # Append recent chat history
    for item in history:
        messages.append({"role": item.role, "content": item.content})

    # Append current user message
    messages.append({"role": "user", "content": query})
    return messages


async def answer_query(
    db: AsyncSession,
    query: str,
    history: list[ChatMessage],
    top_k: int = settings.TOP_K,
) -> tuple[str, list[SourceChunk]]:
    """Retrieve context and generate non-streaming answer."""
    sources = await retrieve_relevant_chunks(db, query, top_k=top_k)
    messages = build_rag_messages(query, sources, history)
    answer = await generate_chat_completion(messages)
    return answer, sources
