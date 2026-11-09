#!/usr/bin/env bash
# NOVA-3D Student AI Companion Launcher

echo "=========================================================="
echo "  🤖 Chatbot Abhi • 3D Robot System & Educational AI"
echo "  Interactive Mecha WebGL • Sub-10ms Speed • Academic Rigor"
echo "  Created by Abhijeeth"
echo "=========================================================="

# Check if .venv exists
if [ -d ".venv" ]; then
    echo "Activating virtual environment (.venv)..."
    source .venv/bin/activate
fi

# Install dependencies if needed
echo "Checking requirements..."
pip install -q -r backend/requirements.txt

# Launch FastAPI app
echo "Launching server on http://localhost:8000 ..."
python main.py
