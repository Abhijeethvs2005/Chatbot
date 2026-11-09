import asyncio
import httpx

BASE_URL = "http://localhost:8000"

async def test_full_pipeline():
    async with httpx.AsyncClient(timeout=60.0) as client:
        # 1. Ingest a sample PDF
        print("[1/3] Uploading document for semantic chunking & indexing...")
        with open("sample_paper.pdf", "rb") as f:
            upload_resp = await client.post(
                f"{BASE_URL}/documents/upload",
                files={"file": ("sample_paper.pdf", f, "application/pdf")}
            )
        
        assert upload_resp.status_code == 201, f"Upload failed: {upload_resp.text}"
        upload_data = upload_resp.json()
        print(f"-> Ingested Doc ID: {upload_data['document_id']} with {upload_data['total_chunks']} chunks.")

        # 2. Test standard vector cosine similarity search
        print("\n[2/3] Testing vector cosine search...")
        dense_resp = await client.post(
            f"{BASE_URL}/documents/search",
            params={"query": "neural network attention mechanisms", "top_k": 2}
        )
        assert dense_resp.status_code == 200, f"Vector search failed: {dense_resp.text}"
        print(f"-> Vector search returned {len(dense_resp.json())} chunks.")

        # 3. Test Hybrid Search (Vector + tsvector BM25 with Reciprocal Rank Fusion)
        print("\n[3/3] Testing Hybrid RRF retrieval...")
        hybrid_resp = await client.get(
            f"{BASE_URL}/documents/hybrid-search",
            params={
                "query": "transformer self-attention GPU memory",
                "final_top_k": 3,
                "candidate_k": 20,
                "rrf_k": 60
            }
        )
        assert hybrid_resp.status_code == 200, f"Hybrid search failed: {hybrid_resp.text}"
        results = hybrid_resp.json()
        
        print(f"-> Retrieved {len(results)} merged chunks via RRF:\n")
        for rank, item in enumerate(results, start=1):
            print(f"[{rank}] Chunk ID {item['chunk_id']} | Page {item['page_number']} | RRF Score: {item['rrf_score']:.6f}")
            print(f"    Dense Rank: {item['dense_rank']} | Sparse Rank: {item['sparse_rank']}")
            print(f"    Excerpt: {item['content'][:140]}...\n")

if __name__ == "__main__":
    asyncio.run(test_full_pipeline())

