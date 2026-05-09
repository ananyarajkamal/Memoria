"""
FastAPI Backend for Memoria - Personal AI Memory Assistant
"""
import os
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import uuid
from rag_pipeline import RAGPipeline
from memory_store import MemoryStore

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Memoria - Personal AI Memory Assistant",
    description="An AI chatbot with long-term memory using RAG",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG pipeline
rag_pipeline = RAGPipeline()

# Pydantic models
class ChatMessage(BaseModel):
    message: str
    user_id: Optional[str] = "default"

class ChatResponse(BaseModel):
    response: str
    memories_used: List[Dict]
    timestamp: str
    token_count: int

class MemoryItem(BaseModel):
    content: str
    metadata: Dict
    timestamp: str

class MemoryStats(BaseModel):
    total_conversations: int
    index_size: int
    embedding_dimension: int

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)
    
    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# API Routes
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Personal AI Memory Assistant API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "memory_stats": rag_pipeline.get_memory_summary()["stats"]
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    """Chat endpoint with memory integration"""
    try:
        result = rag_pipeline.generate_response(message.message, message.user_id)
        
        return ChatResponse(
            response=result["response"],
            memories_used=result["memories_used"],
            timestamp=datetime.now().isoformat(),
            token_count=result.get("token_count", 0)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/stream")
async def chat_stream(message: ChatMessage):
    """Streaming chat endpoint"""
    async def generate():
        try:
            for chunk in rag_pipeline.stream_response(message.message, message.user_id):
                yield f"data: {json.dumps(chunk)}\n\n"
        except Exception as e:
            error_chunk = {
                "chunk": "I'm sorry, I'm having trouble generating a response right now. Please try again.",
                "complete": True,
                "error": str(e)
            }
            yield f"data: {json.dumps(error_chunk)}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time chat"""
    await manager.connect(websocket)
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Generate response
            for chunk in rag_pipeline.stream_response(
                message_data.get("message", ""), 
                message_data.get("user_id", "default")
            ):
                await manager.send_personal_message(json.dumps(chunk), websocket)
                
                if chunk.get("complete", False):
                    break
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        error_chunk = {
            "chunk": "Connection error occurred. Please refresh and try again.",
            "complete": True,
            "error": str(e)
        }
        await manager.send_personal_message(json.dumps(error_chunk), websocket)
        manager.disconnect(websocket)

@app.get("/memories", response_model=List[MemoryItem])
async def get_memories():
    """Get all stored memories"""
    try:
        memories = rag_pipeline.memory_store.get_all_memories()
        
        return [
            MemoryItem(
                content=mem["content"],
                metadata=mem["metadata"],
                timestamp=mem["metadata"].get("timestamp", "")
            )
            for mem in memories
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/memories")
async def clear_memories():
    """Clear all memories"""
    try:
        rag_pipeline.clear_all_memories()
        return {"message": "All memories cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/memories/{index}")
async def delete_memory(index: int):
    """Delete a specific memory by index"""
    try:
        rag_pipeline.delete_memory(index)
        return {"message": f"Memory at index {index} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/memories/stats", response_model=MemoryStats)
async def get_memory_stats():
    """Get memory statistics"""
    try:
        stats = rag_pipeline.memory_store.get_memory_stats()
        return MemoryStats(**stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/memories/summary")
async def get_memory_summary():
    """Get memory summary with recent memories"""
    try:
        return rag_pipeline.get_memory_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/memories/search")
async def search_memories(query: str, k: int = 5):
    """Search memories by query"""
    try:
        memories = rag_pipeline.memory_store.search_memory(query, k)
        
        return [
            {
                "content": mem.page_content,
                "metadata": mem.metadata,
                "similarity_score": mem.metadata.get("similarity_score", 0)
            }
            for mem in memories
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# User management (simple mock authentication)
class User(BaseModel):
    user_id: str
    name: str
    preferences: Dict[str, Any] = {}

# Mock user database
users_db = {}

# File upload imports
from fastapi import File, UploadFile
import io
import base64
try:
    from PyPDF2 import PdfReader
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False

try:
    from PIL import Image
    IMAGE_SUPPORT = True
except ImportError:
    IMAGE_SUPPORT = False

def extract_text_from_pdf(file_bytes):
    """Extract text from PDF file"""
    if not PDF_SUPPORT:
        return "PDF processing not available. Please install PyPDF2."
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text.strip() if text else "No text found in PDF."
    except Exception as e:
        return f"Error reading PDF: {str(e)}"

def extract_text_from_image(file_bytes):
    """Extract image metadata (actual OCR would need additional libraries)"""
    if not IMAGE_SUPPORT:
        return "Image processing not available. Please install Pillow."
    try:
        img = Image.open(io.BytesIO(file_bytes))
        return f"Image uploaded: {img.format}, {img.size[0]}x{img.size[1]} pixels, Mode: {img.mode}. Use this image for visual analysis."
    except Exception as e:
        return f"Error reading image: {str(e)}"

def extract_text_from_docx(file_bytes):
    """Extract text from DOCX file"""
    try:
        import zipfile
        from xml.etree import ElementTree as ET
        
        docx_file = io.BytesIO(file_bytes)
        zip_file = zipfile.ZipFile(docx_file)
        
        # Read the document.xml file from the DOCX
        xml_content = zip_file.read('word/document.xml')
        zip_file.close()
        
        # Parse the XML
        tree = ET.fromstring(xml_content)
        
        # Extract text from all paragraph elements
        namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        text = []
        
        for paragraph in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
            para_text = []
            for node in paragraph.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
                if node.text:
                    para_text.append(node.text)
            if para_text:
                text.append(''.join(para_text))
        
        return '\n'.join(text) if text else "No text found in DOCX file."
    except Exception as e:
        return f"Error reading DOCX file: {str(e)}"

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload and process PDF, image, or text files"""
    try:
        contents = await file.read()
        filename = file.filename.lower()
        
        # Determine file type and extract content
        if filename.endswith('.pdf'):
            extracted_text = extract_text_from_pdf(contents)
            file_type = "pdf"
        elif filename.endswith(('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp')):
            extracted_text = extract_text_from_image(contents)
            file_type = "image"
        elif filename.endswith(('.doc', '.docx')):
            print("Processing Word document...")
            extracted_text = extract_text_from_docx(contents)
            file_type = "docx"
        elif filename.endswith(('.txt', '.md', '.csv', '.json')):
            extracted_text = contents.decode('utf-8', errors='ignore')
            file_type = "text"
        else:
            # Try to decode as text, fallback to binary info
            try:
                extracted_text = contents.decode('utf-8', errors='ignore')
                file_type = "text"
            except:
                extracted_text = f"Binary file uploaded: {file.filename}"
                file_type = "binary"
        
        # Store in memory with file metadata
        memory_content = f"[File Upload: {file.filename}]\n{extracted_text[:2000]}"  # Limit to 2000 chars
        
        rag_pipeline.memory_store.add_memory(
            content=memory_content,
            metadata={
                "type": "file_upload",
                "file_name": file.filename,
                "file_type": file_type,
                "file_size": len(contents),
                "timestamp": datetime.now().isoformat()
            }
        )
        
        return {
            "message": f"File '{file.filename}' uploaded and processed successfully",
            "file_type": file_type,
            "file_size": len(contents),
            "content_preview": extracted_text[:500] if len(extracted_text) > 500 else extracted_text,
            "content_length": len(extracted_text)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/upload/chat")
async def upload_and_chat(file: UploadFile = File(...), message: str = ""):
    """Upload file and get AI analysis"""
    try:
        print(f"Received file: {file.filename}, message: {message}")
        contents = await file.read()
        print(f"File size: {len(contents)} bytes")
        
        filename = file.filename.lower()
        
        # Extract content based on file type
        if filename.endswith('.pdf'):
            print("Processing PDF...")
            extracted_text = extract_text_from_pdf(contents)
            file_type = "pdf"
        elif filename.endswith(('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp')):
            print("Processing image...")
            extracted_text = extract_text_from_image(contents)
            file_type = "image"
        elif filename.endswith(('.doc', '.docx')):
            print("Processing Word document...")
            extracted_text = extract_text_from_docx(contents)
            file_type = "docx"
        elif filename.endswith(('.txt', '.md', '.csv', '.json')):
            print("Processing text file...")
            extracted_text = contents.decode('utf-8', errors='ignore')
            file_type = "text"
        else:
            try:
                extracted_text = contents.decode('utf-8', errors='ignore')
                file_type = "text"
            except:
                extracted_text = f"Binary file: {file.filename}"
                file_type = "binary"
        
        print(f"Extracted text length: {len(extracted_text)}")
        
        # Combine with user's message if provided
        prompt = f"Analyze this file '{file.filename}':\n\n{extracted_text[:3000]}"
        if message:
            prompt += f"\n\nUser question: {message}"
        
        print(f"Sending prompt to Gemini (length: {len(prompt)})")
        
        # Generate response
        result = rag_pipeline.generate_response(prompt, "default")
        
        print(f"Got response from Gemini: {result['response'][:100]}...")
        
        # Store the interaction in memory
        rag_pipeline.memory_store.add_memory(
            content=f"File analyzed: {file.filename}\nQuestion: {message}\nResponse: {result['response'][:500]}",
            metadata={
                "type": "file_analysis",
                "file_name": file.filename,
                "file_type": file_type,
                "timestamp": datetime.now().isoformat()
            }
        )
        
        return {
            "response": result["response"],
            "file_name": file.filename,
            "file_type": file_type,
            "memories_used": result["memories_used"],
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        import traceback
        print(f"ERROR in upload_and_chat: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/users")
async def create_user(user: User):
    """Create a new user"""
    users_db[user.user_id] = user
    return {"message": "User created successfully", "user_id": user.user_id}

@app.get("/users/{user_id}")
async def get_user(user_id: str):
    """Get user information"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    return users_db[user_id]

@app.put("/users/{user_id}/preferences")
async def update_user_preferences(user_id: str, preferences: Dict[str, Any]):
    """Update user preferences"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    users_db[user_id].preferences.update(preferences)
    return {"message": "Preferences updated successfully"}

# Multimodal and Voice endpoints
class ImageAnalysisRequest(BaseModel):
    message: str = ""
    user_id: Optional[str] = "default"

@app.post("/analyze-image")
async def analyze_image_endpoint(file: UploadFile = File(...), message: str = "", user_id: str = "default"):
    """Analyze an image using multimodal AI"""
    try:
        contents = await file.read()
        result = rag_pipeline.analyze_image(contents, message, user_id)
        return {
            "response": result["response"],
            "memories_used": result.get("memories_used", []),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        import traceback
        print(f"ERROR in analyze_image: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error analyzing image: {str(e)}")

# Run the app
if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    )
