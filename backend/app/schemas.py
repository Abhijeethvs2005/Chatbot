from __future__ import annotations

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class DocumentResponse(BaseModel):
    id: int
    filename: str
    file_size: int
    chunk_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentChunkResponse(BaseModel):
    id: int
    document_id: int
    chunk_index: int
    content: str

    model_config = ConfigDict(from_attributes=True)


class SourceChunk(BaseModel):
    document_id: int
    filename: str
    chunk_index: int
    content: str
    score: float = Field(..., description="Cosine similarity score (0 to 1, higher is better)")


class ChatMessage(BaseModel):
    role: str = Field(..., description="Role: 'user', 'assistant', or 'system'")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User prompt / query")
    history: list[ChatMessage] = Field(default_factory=list, description="Optional conversation history")
    top_k: Optional[int] = Field(default=None, description="Number of context chunks to retrieve")
    stream: bool = Field(default=False, description="Whether to stream the assistant response")
    session_id: Optional[str] = Field(default=None, description="Optional conversation thread session ID")


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]
    session_id: Optional[str] = None


class SessionCreate(BaseModel):
    title: Optional[str] = None


class SessionItem(BaseModel):
    id: str
    title: str
    message_count: int
    last_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class SavedChatMessage(BaseModel):
    id: int
    session_id: str
    role: str
    content: str
    sources: Optional[list[SourceChunk]] = None
    created_at: datetime


class SessionDetail(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[SavedChatMessage]


class HealthResponse(BaseModel):
    status: str
    database: str
    version: str = "1.0.0"
