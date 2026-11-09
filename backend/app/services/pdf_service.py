from __future__ import annotations

import io
import re
from pypdf import PdfReader

from app.config import settings


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract raw text from PDF bytes using pypdf."""
    reader = PdfReader(io.BytesIO(pdf_bytes))
    extracted_text = []

    for page_num, page in enumerate(reader.pages, start=1):
        page_text = page.extract_text()
        if page_text:
            # Clean up redundant spaces and empty lines
            cleaned = re.sub(r"[ \t]+", " ", page_text).strip()
            extracted_text.append(cleaned)

    return "\n\n".join(extracted_text)


def chunk_text(
    text: str,
    chunk_size: int = settings.CHUNK_SIZE,
    chunk_overlap: int = settings.CHUNK_OVERLAP,
) -> list[str]:
    """
    Split text into overlapping chunks.
    Attempts to split at sentence or paragraph boundaries where practical.
    """
    if not text or not text.strip():
        return []

    chunks: list[str] = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = start + chunk_size

        if end >= text_len:
            chunk = text[start:].strip()
            if chunk:
                chunks.append(chunk)
            break

        # Try to find a clean break point (newline or period)
        break_point = -1
        # Search backwards from end for paragraph breaks first
        newline_idx = text.rfind("\n", start, end)
        if newline_idx != -1 and newline_idx > start + (chunk_size // 2):
            break_point = newline_idx + 1
        else:
            # Search for sentence period
            period_idx = text.rfind(". ", start, end)
            if period_idx != -1 and period_idx > start + (chunk_size // 2):
                break_point = period_idx + 2

        if break_point == -1:
            # Search for space break
            space_idx = text.rfind(" ", start, end)
            if space_idx != -1 and space_idx > start + (chunk_size // 2):
                break_point = space_idx + 1
            else:
                break_point = end

        chunk = text[start:break_point].strip()
        if chunk:
            chunks.append(chunk)

        # Slide window with overlap
        start = max(start + 1, break_point - chunk_overlap)

    return chunks
