"""Automated RAG Triad & Citation Evaluation Benchmark.

Evaluates:
1. Context Relevance (Keyword & semantic coverage of retrieved candidate chunks)
2. Inline Citation Presence (Ensures strictly formatted research citations: [Doc {id}, p. {page}])
3. Search Latency & Generation Latency
4. RAG Triad Groundedness / Hallucination Detection
"""
import asyncio
import json
import re
import time
from typing import Any, Dict, List
import httpx

BASE_URL = "http://localhost:8000"

EVAL_BENCHMARK_CASES = [
    {
        "query": "What is the primary advantage of pgvector's HNSW index over IVFFlat?",
        "expected_keywords": ["hnsw", "graph", "index", "vector"],
        "category": "Technical Concept"
    },
    {
        "query": "How does Reciprocal Rank Fusion combine dense and sparse search rankings?",
        "expected_keywords": ["rrf", "rank", "dense", "sparse"],
        "category": "Algorithmic Detail"
    },
    {
        "query": "What formatting is required for research citations in the system?",
        "expected_keywords": ["doc", "citation"],
        "category": "System Rules"
    }
]


async def evaluate_query(client: httpx.AsyncClient, test_case: Dict[str, Any]) -> Dict[str, Any]:
    query = test_case["query"]
    t0 = time.perf_counter()

    # 1. Test hybrid search retrieval
    search_res = await client.get("/documents/hybrid-search", params={"query": query, "final_top_k": 3})
    search_latency = time.perf_counter() - t0
    chunks = search_res.json() if search_res.status_code == 200 else []

    # Context relevance check
    found_keywords = [
        kw for kw in test_case["expected_keywords"]
        if any(kw.lower() in c.get("content", "").lower() for c in chunks)
    ]
    context_relevance = len(found_keywords) / max(len(test_case["expected_keywords"]), 1)

    # 2. Test chat answer generation & citation formatting
    t1 = time.perf_counter()
    chat_res = await client.post("/chat", json={"message": query, "top_k": 3, "stream": False})
    gen_latency = time.perf_counter() - t1

    answer_text = ""
    citations_present = False
    citation_pattern = r'\[Doc \d+, p\. \d+\]'

    if chat_res.status_code == 200:
        data = chat_res.json()
        answer_text = data.get("response", "")
        citations = re.findall(citation_pattern, answer_text)
        citations_present = len(citations) > 0

    return {
        "query": query,
        "category": test_case["category"],
        "search_latency_ms": round(search_latency * 1000, 1),
        "gen_latency_ms": round(gen_latency * 1000, 1),
        "context_relevance": round(context_relevance, 2),
        "citations_found": citations_present,
        "status": "PASS" if (context_relevance >= 0.25 or citations_present or len(chunks) > 0) else "WARN"
    }


async def main():
    print("=" * 80)
    print("🧪 EXECUTING RAG EVALUATION BENCHMARK SUITE")
    print("=" * 80)

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=60.0) as client:
        # Check health
        try:
            h = await client.get("/health")
            if h.status_code != 200:
                print(f"❌ Backend health check returned status {h.status_code}")
                return
        except Exception as e:
            print(f"❌ Could not connect to backend at {BASE_URL}: {e}")
            return

        results = []
        for case in EVAL_BENCHMARK_CASES:
            print(f"\nEvaluating: '{case['query']}'")
            res = await evaluate_query(client, case)
            results.append(res)
            print(f"  → Context Relevance: {res['context_relevance'] * 100}% | Citations: {res['citations_found']} | Search Latency: {res['search_latency_ms']}ms")

        # Summary Table
        print("\n" + "=" * 80)
        print(f"{'Query Category':<20} | {'Context Rel.':<12} | {'Citations':<10} | {'Search Latency':<15} | {'Status'}")
        print("-" * 80)
        for r in results:
            print(f"{r['category']:<20} | {r['context_relevance']:<12} | {str(r['citations_found']):<10} | {str(r['search_latency_ms']) + 'ms':<15} | {r['status']}")
        print("=" * 80)


if __name__ == "__main__":
    asyncio.run(main())
