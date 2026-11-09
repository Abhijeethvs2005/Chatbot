"""Re-export app from main.py for compatibility with 'uvicorn app.main:app' and 'uvicorn main:app'."""
from main import app

__all__ = ["app"]
