import uvicorn
from backend.main import app

if __name__ == "__main__":
    print("🚀 Starting Chatbot Abhi on http://localhost:8000")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
