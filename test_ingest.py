"""Quick test script to verify PDF upload and vector search.

Usage:
    python test_ingest.py /path/to/sample.pdf "your search query"
"""
import sys
import httpx

BASE_URL = "http://localhost:8000"


def test_upload(pdf_path: str):
    print(f"\n[1] Uploading '{pdf_path}' to {BASE_URL}/documents/upload...")
    with open(pdf_path, "rb") as f:
        files = {"file": (pdf_path.split("/")[-1], f, "application/pdf")}
        response = httpx.post(f"{BASE_URL}/documents/upload", files=files, timeout=60.0)

    if response.status_code == 201:
        data = response.json()
        print(" Upload successful!")
        print(f"    Document ID : {data['document_id']}")
        print(f"    Filename    : {data['filename']}")
        print(f"    Total Chunks: {data['total_chunks']}")
        return data["document_id"]
    else:
        print(f"❌ Upload failed ({response.status_code}): {response.text}")
        return None


def test_search(query: str, top_k: int = 3):
    print(f"\n[2] Searching for: '{query}' (top_k={top_k})...")
    response = httpx.post(
        f"{BASE_URL}/documents/search",
        params={"query": query, "top_k": top_k},
        timeout=30.0,
    )

    if response.status_code == 200:
        results = response.json()
        print(f" Found {len(results)} relevant chunks:\n")
        for i, item in enumerate(results, start=1):
            print(f"--- Result #{i} (Similarity: {item['similarity']:.4f}, Page {item['page_number']}) ---")
            print(f"{item['content'][:300]}...")
            print()
    else:
        print(f"❌ Search failed ({response.status_code}): {response.text}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python test_ingest.py <path_to_pdf> <search_query>")
        sys.exit(1)

    pdf_file = sys.argv[1]
    query_text = sys.argv[2]

    doc_id = test_upload(pdf_file)
    if doc_id:
        test_search(query_text)

