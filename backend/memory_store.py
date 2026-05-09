"""
Memory Store Module - Handles vector storage and retrieval of conversation memory
"""
import os
import json
import pickle
from typing import List, Dict, Any, Optional
import numpy as np
import faiss
from langchain_core.documents import Document
from sentence_transformers import SentenceTransformer
import tiktoken


class MemoryStore:
    """Vector-based memory storage using FAISS for conversation history"""
    
    def __init__(self, embedding_model: str = "sentence-transformers"):
        self.embedding_model = embedding_model
        self.index = None
        self.documents = []
        self.embeddings = []
        self.dimension = 384  # Sentence transformer dimension
        
        # Initialize embedding service
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize FAISS index
        self._init_index()
        
        # Load existing memory if available
        self._load_memory()
    
    def _init_index(self):
        """Initialize FAISS index"""
        self.index = faiss.IndexFlatL2(self.dimension)
    
    def _load_memory(self):
        """Load existing memory from disk"""
        try:
            if os.path.exists("memory_index.faiss"):
                self.index = faiss.read_index("memory_index.faiss")
                with open("memory_documents.pkl", "rb") as f:
                    self.documents = pickle.load(f)
                with open("memory_embeddings.pkl", "rb") as f:
                    self.embeddings = pickle.load(f)
        except Exception as e:
            print(f"Error loading memory: {e}")
            self._init_index()
    
    def _save_memory(self):
        """Save memory to disk"""
        try:
            faiss.write_index(self.index, "memory_index.faiss")
            with open("memory_documents.pkl", "wb") as f:
                pickle.dump(self.documents, f)
            with open("memory_embeddings.pkl", "wb") as f:
                pickle.dump(self.embeddings, f)
        except Exception as e:
            print(f"Error saving memory: {e}")
    
    def add_conversation(self, user_message: str, ai_response: str, metadata: Optional[Dict] = None):
        """Add a conversation to memory"""
        # Create document with both user and AI messages
        content = f"User: {user_message}\nAI: {ai_response}"
        doc = Document(
            page_content=content,
            metadata={
                "timestamp": metadata.get("timestamp", ""),
                "user_message": user_message,
                "ai_response": ai_response,
                **(metadata or {})
            }
        )
        
        # Generate embedding
        embedding = self.embedder.encode(content).tolist()
        
        # Convert to numpy array
        embedding_array = np.array([embedding]).astype('float32')
        
        # Add to FAISS index
        self.index.add(embedding_array)
        
        # Store document and embedding
        self.documents.append(doc)
        self.embeddings.append(embedding)
        
        # Save to disk
        self._save_memory()
    
    def search_memory(self, query: str, k: int = 5) -> List[Document]:
        """Search memory for relevant conversations"""
        if self.index.ntotal == 0:
            return []
        
        # Generate query embedding
        query_embedding = self.embedder.encode(query).tolist()
        
        # Convert to numpy array
        query_array = np.array([query_embedding]).astype('float32')
        
        # Search FAISS index
        distances, indices = self.index.search(query_array, min(k, self.index.ntotal))
        
        # Return relevant documents
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < len(self.documents):
                doc = self.documents[idx]
                doc.metadata["similarity_score"] = float(distances[0][i])
                results.append(doc)
        
        return results
    
    def get_all_memories(self) -> List[Dict]:
        """Get all stored memories"""
        memories = []
        for doc in self.documents:
            memories.append({
                "content": doc.page_content,
                "metadata": doc.metadata
            })
        return memories
    
    def clear_memory(self):
        """Clear all memory"""
        self._init_index()
        self.documents = []
        self.embeddings = []
        self._save_memory()
    
    def delete_memory_by_index(self, index: int):
        """Delete memory by index"""
        if 0 <= index < len(self.documents):
            del self.documents[index]
            del self.embeddings[index]
            
            # Rebuild index
            self._init_index()
            if self.embeddings:
                embeddings_array = np.array(self.embeddings).astype('float32')
                self.index.add(embeddings_array)
            
            self._save_memory()
    
    def get_memory_stats(self) -> Dict:
        """Get memory statistics"""
        return {
            "total_conversations": len(self.documents),
            "index_size": self.index.ntotal,
            "embedding_dimension": self.dimension
        }
