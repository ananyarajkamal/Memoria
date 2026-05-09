"""
Embedding Service - Handles text embeddings for RAG pipeline
"""
import os
from typing import List, Union
import numpy as np
from sentence_transformers import SentenceTransformer


class EmbeddingService:
    """Service for generating text embeddings"""
    
    def __init__(self, model_name: str = "sentence-transformers"):
        self.model_name = model_name
        self.dimension = 384  # Sentence transformer dimension
        
        # Initialize the embedding model
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
    
    def embed_text(self, text: Union[str, List[str]]) -> List[float]:
        """Generate embeddings for text"""
        if isinstance(text, str):
            return self.embedder.encode(text).tolist()
        else:
            return [self.embedder.encode(t).tolist() for t in text]
    
    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Chunk text into smaller pieces for embedding"""
        # Simple word-based chunking without tiktoken
        words = text.split()
        chunks = []
        
        start = 0
        while start < len(words):
            end = start + chunk_size
            chunk_words = words[start:end]
            chunk_text = ' '.join(chunk_words)
            chunks.append(chunk_text)
            
            if end >= len(words):
                break
            
            start = end - overlap
        
        return chunks
    
    def embed_chunks(self, chunks: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple chunks"""
        return self.embed_text(chunks)
    
    def calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Calculate cosine similarity between two embeddings"""
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)
        
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)
