"""
RAG Pipeline - Retrieval Augmented Generation for personalized AI responses
"""
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import google.generativeai as genai
from memory_store import MemoryStore
from embedding_service import EmbeddingService


class RAGPipeline:
    """RAG Pipeline for generating personalized AI responses"""
    
    def __init__(self, model_name: str = "gemini-2.5-flash"):
        self.model_name = model_name
        self.memory_store = MemoryStore()
        self.embedding_service = EmbeddingService()
        
        # Initialize Gemini
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
        self.model = genai.GenerativeModel(model_name)
        
        # Token limits (Gemini has higher limits)
        self.max_tokens = 8000
        
        # System prompt
        self.system_prompt = """You are a personal AI assistant with long-term memory. 
        You remember past conversations and use that context to provide personalized responses.
        
        Guidelines:
        1. Use the provided memory context to personalize your responses
        2. Reference past conversations when relevant
        3. Remember user preferences, interests, and important details
        4. Maintain a friendly, helpful, and conversational tone
        5. If no relevant memory is found, respond naturally without forcing references
        
        Memory context will be provided below. Use it to enhance your response but don't 
        explicitly mention that you're "using memory" - just incorporate it naturally."""
    
    def count_tokens(self, text: str) -> int:
        """Count tokens in text (approximate for Gemini using word count)"""
        # Approximate: 1 token ≈ 0.75 words for English text
        return int(len(text.split()) * 1.33)
    
    def optimize_context(self, memories: List[Dict], query: str, max_context_tokens: int = 4000) -> str:
        """Optimize memory context to fit within token limits"""
        if not memories:
            return ""
        
        # Sort memories by relevance (similarity score)
        memories.sort(key=lambda x: x.get("similarity_score", 0), reverse=True)
        
        context_parts = []
        used_tokens = 0
        
        # Add system prompt tokens
        system_tokens = self.count_tokens(self.system_prompt)
        query_tokens = self.count_tokens(f"Current question: {query}")
        reserved_tokens = system_tokens + query_tokens + 1000  # Reserve space for response
        
        available_tokens = max_context_tokens - reserved_tokens
        
        for memory in memories:
            memory_text = f"Past conversation: {memory['content'][:300]}..."  # Truncate long memories
            memory_tokens = self.count_tokens(memory_text)
            
            if used_tokens + memory_tokens > available_tokens:
                break
            
            context_parts.append(memory_text)
            used_tokens += memory_tokens
        
        return "\n\n".join(context_parts)
    
    def retrieve_relevant_memories(self, query: str, k: int = 5) -> List[Dict]:
        """Retrieve relevant memories for the query"""
        memories = self.memory_store.search_memory(query, k)
        
        # Convert to dict format
        memory_dicts = []
        for memory in memories:
            memory_dicts.append({
                "content": memory.page_content,
                "metadata": memory.metadata,
                "similarity_score": memory.metadata.get("similarity_score", 0)
            })
        
        return memory_dicts
    
    def generate_response(self, user_message: str, user_id: str = "default") -> Dict[str, Any]:
        """Generate a personalized response using RAG"""
        try:
            # Retrieve relevant memories
            memories = self.retrieve_relevant_memories(user_message, k=5)
            
            # Optimize context
            memory_context = self.optimize_context(memories, user_message)
            
            # Create full prompt
            if memory_context:
                full_prompt = f"{self.system_prompt}\n\nMemory Context:\n{memory_context}\n\nCurrent question: {user_message}"
            else:
                full_prompt = f"{self.system_prompt}\n\nCurrent question: {user_message}"
            
            # Generate response with Gemini
            response = self.model.generate_content(full_prompt)
            ai_response = response.text
            
            # Store conversation in memory
            self.memory_store.add_conversation(
                user_message=user_message,
                ai_response=ai_response,
                metadata={
                    "timestamp": datetime.now().isoformat(),
                    "user_id": user_id,
                    "memories_used": len(memories)
                }
            )
            
            return {
                "response": ai_response,
                "memories_used": memories,
                "context_optimized": True,
                "token_count": self.count_tokens(ai_response)
            }
            
        except Exception as e:
            # Fallback response without memory
            try:
                full_prompt = f"{self.system_prompt}\n\nCurrent question: {user_message}"
                response = self.model.generate_content(full_prompt)
                
                return {
                    "response": response.text,
                    "memories_used": [],
                    "context_optimized": False,
                    "error": str(e),
                    "token_count": self.count_tokens(response.text)
                }
            except Exception as fallback_error:
                error_msg = str(fallback_error)
                if "quota" in error_msg.lower() or "429" in error_msg:
                    return {
                        "response": "I've reached my API usage limit for today. Please try again tomorrow or upgrade to a paid plan for more requests.",
                        "memories_used": [],
                        "context_optimized": False,
                        "error": f"API Quota Exceeded: {str(fallback_error)}",
                        "token_count": 0
                    }
                elif "model" in error_msg.lower() and "not found" in error_msg.lower():
                    return {
                        "response": "There's an issue with the AI model configuration. Please check the model settings.",
                        "memories_used": [],
                        "context_optimized": False,
                        "error": f"Model Error: {str(fallback_error)}",
                        "token_count": 0
                    }
                else:
                    return {
                        "response": f"I'm experiencing technical difficulties. Error: {str(fallback_error)[:100]}",
                        "memories_used": [],
                        "context_optimized": False,
                        "error": f"Primary: {str(e)}, Fallback: {str(fallback_error)}",
                        "token_count": 0
                    }
    
    def stream_response(self, user_message: str, user_id: str = "default"):
        """Stream response generation"""
        try:
            # Retrieve relevant memories
            memories = self.retrieve_relevant_memories(user_message, k=5)
            
            # Optimize context
            memory_context = self.optimize_context(memories, user_message)
            
            # Create full prompt
            if memory_context:
                full_prompt = f"{self.system_prompt}\n\nMemory Context:\n{memory_context}\n\nCurrent question: {user_message}"
            else:
                full_prompt = f"{self.system_prompt}\n\nCurrent question: {user_message}"
            
            # Stream response with Gemini
            response = self.model.generate_content(full_prompt, stream=True)
            
            full_response = ""
            for chunk in response:
                if chunk.text:
                    full_response += chunk.text
                    yield {
                        "chunk": chunk.text,
                        "memories_used": memories,
                        "complete": False
                    }
            
            # Store conversation in memory
            self.memory_store.add_conversation(
                user_message=user_message,
                ai_response=full_response,
                metadata={
                    "timestamp": datetime.now().isoformat(),
                    "user_id": user_id,
                    "memories_used": len(memories)
                }
            )
            
            yield {
                "chunk": "",
                "memories_used": memories,
                "complete": True,
                "full_response": full_response
            }
            
        except Exception as e:
            yield {
                "chunk": "I'm sorry, I'm having trouble generating a response right now. Please try again.",
                "memories_used": [],
                "complete": True,
                "error": str(e)
            }
    
    def get_memory_summary(self) -> Dict:
        """Get a summary of stored memories"""
        stats = self.memory_store.get_memory_stats()
        recent_memories = self.memory_store.search_memory("", k=10)  # Get recent memories
        
        return {
            "stats": stats,
            "recent_memories": [
                {
                    "content": mem.page_content[:100] + "...",
                    "timestamp": mem.metadata.get("timestamp", ""),
                    "metadata": mem.metadata
                }
                for mem in recent_memories
            ]
        }
    
    def clear_all_memories(self):
        """Clear all stored memories"""
        self.memory_store.clear_memory()
    
    def delete_memory(self, index: int):
        """Delete a specific memory"""
        self.memory_store.delete_memory_by_index(index)
    
    def analyze_image(self, image_data: bytes, user_message: str = "", user_id: str = "default") -> Dict[str, Any]:
        """Analyze an image using Gemini's multimodal capabilities"""
        try:
            import io
            from PIL import Image as PILImage
            
            # Convert bytes to PIL Image
            image = PILImage.open(io.BytesIO(image_data))
            
            # Retrieve relevant memories
            query = user_message if user_message else "image analysis"
            memories = self.retrieve_relevant_memories(query, k=3)
            memory_context = self.optimize_context(memories, query)
            
            # Build prompt
            prompt_text = self.system_prompt + "\n\n"
            if memory_context:
                prompt_text += f"Memory Context:\n{memory_context}\n\n"
            prompt_text += "Analyze this image and describe what you see in detail."
            if user_message:
                prompt_text += f"\n\nUser question: {user_message}"
            
            # Generate response with image
            response = self.model.generate_content([prompt_text, image])
            ai_response = response.text
            
            # Store in memory
            self.memory_store.add_conversation(
                user_message=f"[Image uploaded] {user_message}",
                ai_response=ai_response,
                metadata={
                    "timestamp": datetime.now().isoformat(),
                    "user_id": user_id,
                    "type": "image_analysis",
                    "memories_used": len(memories)
                }
            )
            
            return {
                "response": ai_response,
                "memories_used": memories,
                "token_count": self.count_tokens(ai_response)
            }
            
        except Exception as e:
            print(f"Error analyzing image: {str(e)}")
            return {
                "response": f"I can see the image but couldn't analyze it fully. Error: {str(e)}",
                "memories_used": [],
                "error": str(e)
            }
