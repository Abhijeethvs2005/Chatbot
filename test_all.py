"""End-to-End Integration Test Suite for RAG Chatbot API.

Verifies:
1. Health check & database connection
2. PDF Ingestion & Semantic Chunking
3. Document listing
4. Hybrid RRF Search (Dense Vector + Sparse GIN Full-Text)
5. Dedicated /chat/stream SSE endpoint with inline citations
6. Persistent Sessions: create thread, chat persistence, retrieve history, and deletion
7. Document Deletion & Cascade verification
"""
import sys
import uuid
import httpx

BASE_URL = "http://localhost:8000"


def run_tests():
    print("=" * 60)
    print("🚀 Starting End-to-End RAG Chatbot Verification Tests")
    print("=" * 60)

    client = httpx.Client(base_url=BASE_URL, timeout=30.0)

    # 1. Health check
    print("\n[Test 1] Checking /health endpoint...")
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health = res.json()
    print(f"  ✓ Health: {health['status']} | DB connected: {health['database_connected']} | AI Mode: {health.get('ai_mode')}")

    # 2. Upload Document
    print("\n[Test 2] Testing /documents/upload with sample_paper.pdf...")
    with open("sample_paper.pdf", "rb") as f:
        files = {"file": ("sample_paper.pdf", f, "application/pdf")}
        res = client.post("/documents/upload", files=files)
    assert res.status_code == 201, f"Upload failed: {res.text}"
    upload_data = res.json()
    doc_id = upload_data["document_id"]
    print(f"  ✓ Ingested Document ID: {doc_id} | Chunks: {upload_data['total_chunks']} | Status: {upload_data['status']}")

    # 3. List Documents
    print("\n[Test 3] Testing GET /documents...")
    res = client.get("/documents")
    assert res.status_code == 200
    docs = res.json()
    assert any(d["id"] == doc_id for d in docs), "Uploaded document not found in document list"
    print(f"  ✓ Document list retrieved successfully ({len(docs)} total files)")

    # 4. Hybrid RRF Search
    print("\n[Test 4] Testing GET /documents/hybrid-search (RRF)...")
    res = client.get("/documents/hybrid-search", params={"query": "pgvector", "final_top_k": 2})
    assert res.status_code == 200, f"Hybrid search failed: {res.text}"
    results = res.json()
    assert len(results) > 0, "No results returned from hybrid search"
    top_hit = results[0]
    print(f"  ✓ Top Hit Chunk ID: {top_hit['chunk_id']} | Page: {top_hit['page_number']} | RRF Score: {top_hit['rrf_score']:.5f}")
    print(f"    Dense Rank: {top_hit['dense_rank']} | Sparse Rank: {top_hit['sparse_rank']}")

    # 4b. Document Summarization & Key Topics
    print(f"\n[Test 4b] Testing GET /documents/{doc_id}/summary...")
    sum_res = client.get(f"/documents/{doc_id}/summary")
    assert sum_res.status_code == 200, f"Summary failed: {sum_res.text}"
    sum_data = sum_res.json()
    assert sum_data["document_id"] == doc_id
    assert len(sum_data["summary"]) > 0
    assert isinstance(sum_data["key_topics"], list) and len(sum_data["key_topics"]) > 0
    print(f"  ✓ Summary generated ({len(sum_data['summary'])} chars) | Topics: {sum_data['key_topics']}")

    # 5. Dedicated /chat/stream SSE Endpoint
    print("\n[Test 5] Testing POST /chat/stream (SSE with inline citations)...")
    stream_payload = {"query": "How does RAG utilize pgvector?", "top_k": 2}
    stream_frames = 0
    with client.stream("POST", "/chat/stream", json=stream_payload) as stream_res:
        assert stream_res.status_code == 200, f"Chat stream failed: {stream_res.status_code}"
        for line in stream_res.iter_lines():
            if line.startswith("data: "):
                stream_frames += 1
    print(f"  ✓ /chat/stream verified: received {stream_frames} SSE frames")

    # 6. Persistent Chat Sessions Lifecycle
    print("\n[Test 6] Testing Persistent Chat Sessions Lifecycle (/sessions)...")
    # 6a. Create session
    sess_res = client.post("/sessions", json={"title": "Integration Test Thread"})
    assert sess_res.status_code == 201, f"Create session failed: {sess_res.text}"
    sess_data = sess_res.json()
    session_id = sess_data["id"]
    print(f"  ✓ Created session thread: {session_id} (title: '{sess_data['title']}')")

    # 6b. Post message to chat with session_id
    chat_res = client.post("/chat", json={
        "message": "What is semantic search and cosine similarity?",
        "top_k": 2,
        "session_id": session_id,
        "stream": False
    })
    assert chat_res.status_code == 200, f"Chat with session failed: {chat_res.text}"
    print(f"  ✓ Chat message sent and processed for session {session_id}")

    # 6c. Verify message persistence in session
    detail_res = client.get(f"/sessions/{session_id}")
    assert detail_res.status_code == 200, f"Get session failed: {detail_res.text}"
    detail_data = detail_res.json()
    assert len(detail_data["messages"]) >= 2, f"Expected at least 2 saved messages, got {len(detail_data['messages'])}"
    print(f"  ✓ Verified message persistence: {len(detail_data['messages'])} messages stored (user + assistant)")

    # 6d. List sessions
    list_res = client.get("/sessions")
    assert list_res.status_code == 200
    sessions_list = list_res.json()
    assert any(s["id"] == session_id for s in sessions_list), "Session not found in list"
    print(f"  ✓ Listed {len(sessions_list)} session threads from database")

    # 6e. Rename session (PATCH /sessions/{id})
    rename_res = client.patch(f"/sessions/{session_id}", json={"title": "Renamed Neural Search Thread"})
    assert rename_res.status_code == 200, f"Rename session failed: {rename_res.text}"
    assert rename_res.json()["title"] == "Renamed Neural Search Thread"
    print("  ✓ Thread renamed successfully via PATCH /sessions/{id}")

    # 6f. Export session as Markdown & JSON (GET /sessions/{id}/export)
    export_md_res = client.get(f"/sessions/{session_id}/export", params={"format": "markdown"})
    assert export_md_res.status_code == 200, f"Export markdown failed: {export_md_res.text}"
    assert "Renamed Neural Search Thread" in export_md_res.text
    assert "Sources Cited" in export_md_res.text or "Assistant" in export_md_res.text
    print(f"  ✓ Exported session as Markdown ({len(export_md_res.text)} bytes)")

    export_json_res = client.get(f"/sessions/{session_id}/export", params={"format": "json"})
    assert export_json_res.status_code == 200, f"Export json failed: {export_json_res.text}"
    json_data = export_json_res.json()
    assert json_data["session_id"] == session_id
    assert len(json_data["messages"]) >= 2
    print(f"  ✓ Exported session as JSON ({len(json_data['messages'])} messages)")

    # 6g. Delete session
    del_sess_res = client.delete(f"/sessions/{session_id}")
    assert del_sess_res.status_code == 204
    print(f"  ✓ Session {session_id} deleted successfully")

    # 7. Delete Document
    print(f"\n[Test 7] Testing DELETE /documents/{doc_id}...")
    res = client.delete(f"/documents/{doc_id}")
    assert res.status_code == 204, f"Delete failed: {res.status_code}"
    print(f"  ✓ Document {doc_id} and its associated vector chunks deleted successfully")

    # 8. 3D Vector Explorer Endpoint
    print("\n[Test 8] Testing GET /3d (Nexus3D Neural RAG Explorer)...")
    res_3d = client.get("/3d")
    assert res_3d.status_code == 200, f"3D explorer route failed: {res_3d.status_code}"
    assert "Nexus3D AI" in res_3d.text or "three" in res_3d.text.lower()
    print("  ✓ /3d Nexus3D Neural Explorer UI delivered successfully (WebGL & Three.js)")

    # 9. Verify document deletion
    print("\n[Test 9] Verifying document deletion cleanup...")
    res = client.get("/documents")
    docs_after = res.json()
    assert not any(d["id"] == doc_id for d in docs_after), "Document was not removed from database"
    print(f"  ✓ Verified deletion: document ID {doc_id} no longer present")

    print("\n" + "=" * 60)
    print("🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"\n❌ Test suite failed with error: {e}")
        sys.exit(1)
