import json
import os
from pathlib import Path

import httpx
import numpy as np

from app.config import settings

EMBEDDING_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/embeddings"
DATA_DIR = Path(__file__).parent.parent.parent / "data" / "faiss"


class RAGService:
    def __init__(self):
        self.api_key = settings.dashscope_api_key
        self._index = None
        self._documents: list[dict] = []
        self._dimension = 1024
        DATA_DIR.mkdir(parents=True, exist_ok=True)

    def _get_index(self):
        if self._index is not None:
            return self._index

        try:
            import faiss
            index_path = DATA_DIR / "index.faiss"
            doc_path = DATA_DIR / "documents.json"

            if index_path.exists() and doc_path.exists():
                self._index = faiss.read_index(str(index_path))
                with open(doc_path) as f:
                    self._documents = json.load(f)
            else:
                self._index = faiss.IndexFlatIP(self._dimension)
        except ImportError:
            self._index = None

        return self._index

    def _save(self):
        try:
            import faiss
            index_path = DATA_DIR / "index.faiss"
            doc_path = DATA_DIR / "documents.json"
            faiss.write_index(self._index, str(index_path))
            with open(doc_path, "w") as f:
                json.dump(self._documents, f, ensure_ascii=False)
        except ImportError:
            pass

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                EMBEDDING_URL,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "text-embedding-v3",
                    "input": texts,
                    "dimensions": self._dimension,
                },
            )
            response.raise_for_status()
            data = response.json()
            return [item["embedding"] for item in data["data"]]

    async def add_documents(self, documents: list[dict]):
        index = self._get_index()
        if index is None:
            return

        texts = [f"{d.get('title', '')} {d.get('content', '')}" for d in documents]
        if not texts:
            return

        embeddings = await self.embed_texts(texts)
        vectors = np.array(embeddings, dtype=np.float32)

        index.add(vectors)
        self._documents.extend(documents)
        self._save()

    async def search(self, query: str, top_k: int = 5) -> list[dict]:
        index = self._get_index()
        if index is None or index.ntotal == 0:
            return []

        embeddings = await self.embed_texts([query])
        vector = np.array(embeddings, dtype=np.float32)

        scores, indices = index.search(vector, min(top_k, index.ntotal))

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or idx >= len(self._documents):
                continue
            doc = self._documents[idx].copy()
            doc["score"] = float(score)
            results.append(doc)

        return results

    def clear(self):
        try:
            import faiss
            self._index = faiss.IndexFlatIP(self._dimension)
            self._documents = []
            self._save()
        except ImportError:
            self._index = None
            self._documents = []

    @property
    def count(self) -> int:
        index = self._get_index()
        return index.ntotal if index else 0


rag_service = RAGService()
