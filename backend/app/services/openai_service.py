from __future__ import annotations

from collections.abc import AsyncGenerator
from typing import Optional
from openai import AsyncOpenAI

from app.config import settings

_client: Optional[AsyncOpenAI] = None


def get_openai_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        if not settings.OPENAI_API_KEY:
            raise ValueError(
                "OPENAI_API_KEY is not set. Please provide your API key in .env or environment variables."
            )
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


async def get_embedding(text: str) -> list[float]:
    """Generate embedding vector for a single text string."""
    client = get_openai_client()
    clean_text = text.replace("\n", " ").strip()
    response = await client.embeddings.create(
        input=[clean_text],
        model=settings.EMBEDDING_MODEL,
    )
    return response.data[0].embedding


async def get_embeddings_batch(texts: list[str], batch_size: int = 100) -> list[list[float]]:
    """Generate embedding vectors for a batch of text chunks."""
    if not texts:
        return []

    client = get_openai_client()
    embeddings: list[list[float]] = []

    for i in range(0, len(texts), batch_size):
        batch = [t.replace("\n", " ").strip() for t in texts[i : i + batch_size]]
        response = await client.embeddings.create(
            input=batch,
            model=settings.EMBEDDING_MODEL,
        )
        # Preserve input order
        batch_embeddings = [item.embedding for item in response.data]
        embeddings.extend(batch_embeddings)

    return embeddings


async def generate_chat_completion(messages: list[dict]) -> str:
    """Generate standard non-streaming chat response."""
    client = get_openai_client()
    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=messages,
        temperature=0.3,
    )
    return response.choices[0].message.content or ""


async def stream_chat_completion(messages: list[dict]) -> AsyncGenerator[str, None]:
    """Stream chat response tokens."""
    client = get_openai_client()
    response_stream = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=messages,
        temperature=0.3,
        stream=True,
    )
    async for chunk in response_stream:
        delta = chunk.choices[0].delta
        if delta and delta.content:
            yield delta.content
