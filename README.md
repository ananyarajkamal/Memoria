# Memoria - Your Personal AI Memory Assistant

A sophisticated AI chatbot with long-term memory using Retrieval Augmented Generation (RAG). This application provides a ChatGPT-like experience with persistent memory that personalizes responses based on past conversations.

## Features

- **Real-time Chat Interface**: Modern, responsive chat UI with streaming responses
- **Long-term Memory**: Automatically stores and retrieves relevant past conversations
- **RAG Pipeline**: Uses vector embeddings for intelligent memory retrieval
- **Personalization**: AI remembers user preferences, topics, and conversation context
- **Memory Management**: View, search, and delete stored memories
- **Dark Mode**: Full dark mode support with smooth transitions
- **Modern UI**: Instagram-inspired design with emerald green theme

## Architecture

### Backend (Python/FastAPI)
- **FastAPI**: High-performance async web framework
- **LangChain**: Framework for LLM applications
- **FAISS**: Vector database for memory storage
- **OpenAI**: LLM for generating responses
- **Sentence Transformers**: Alternative local embeddings

### Frontend (React/Tailwind)
- **React 18**: Modern React with hooks
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Beautiful icons
- **Axios**: HTTP client with interceptors

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- OpenAI API key

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Mac/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

5. **Start the backend server**
   ```bash
   python app.py
   ```
   
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```
   
   The app will be available at `http://localhost:3000`

## Project Structure

```
Personal AI Memory Assistant/
├── backend/
│   ├── app.py                 # FastAPI main application
│   ├── rag_pipeline.py        # RAG implementation
│   ├── memory_store.py        # Vector memory storage
│   ├── embedding_service.py   # Text embeddings
│   ├── requirements.txt       # Python dependencies
│   └── .env.example          # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Page components
│   │   │   ├── Login.js      # Login page
│   │   │   ├── Chat.js       # Chat interface
│   │   │   └── MemoryDashboard.js # Memory management
│   │   ├── services/         # API services
│   │   │   └── chatService.js
│   │   ├── App.js            # Main app component
│   │   ├── index.js          # Entry point
│   │   └── index.css         # Global styles
│   ├── public/
│   │   └── index.html        # HTML template
│   ├── package.json          # Node dependencies
│   ├── tailwind.config.js    # Tailwind configuration
│   └── postcss.config.js     # PostCSS configuration
└── README.md                 # This file
```

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo

# Optional: Pinecone Configuration (for cloud vector storage)
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment_here
PINECONE_INDEX_NAME=ai-memory-assistant

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Memory Configuration
MAX_MEMORY_SIZE=1000
EMBEDDING_MODEL=text-embedding-ada-002
CHUNK_SIZE=500
CHUNK_OVERLAP=50
```

## How It Works

### 1. Memory Storage
- Every conversation is converted to text embeddings
- Embeddings are stored in FAISS vector database
- Metadata includes timestamps, user info, and content

### 2. Memory Retrieval
- When a user sends a message, the system:
  - Generates embedding for the new message
  - Searches vector database for similar past conversations
  - Retrieves top-k most relevant memories

### 3. Response Generation
- Retrieved memories are added to the AI prompt
- The LLM uses this context to generate personalized responses
- Responses reference past conversations naturally

### 4. Context Optimization
- System manages token limits efficiently
- Long conversations are chunked appropriately
- Memory context is optimized for relevance

## UI Features

### Chat Interface
- Real-time streaming responses
- Typing indicators
- Message history with timestamps
- Memory context indicators
- Dark/light mode toggle

### Memory Dashboard
- View all stored conversations
- Search memories by content
- Memory statistics and insights
- Delete individual or all memories
- Similarity scores for searches

## API Endpoints

### Chat
- `POST /chat` - Send message and get response
- `POST /chat/stream` - Stream response in real-time
- `WebSocket /ws` - WebSocket connection for chat

### Memory Management
- `GET /memories` - Get all stored memories
- `POST /memories/search` - Search memories
- `DELETE /memories` - Clear all memories
- `DELETE /memories/{index}` - Delete specific memory
- `GET /memories/stats` - Get memory statistics
- `GET /memories/summary` - Get memory summary

### System
- `GET /health` - Health check
- `GET /` - API info

## Deployment

### Backend Deployment
1. Set up production environment variables
2. Use Gunicorn or similar WSGI server
3. Configure reverse proxy (nginx)
4. Set up SSL certificates

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy to static hosting (Vercel, Netlify, etc.)
3. Configure API proxy to backend

## Security Considerations

- API keys should be stored securely
- Enable CORS for specific domains in production
- Implement rate limiting
- Add authentication for multi-user scenarios
- Sanitize user inputs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Troubleshooting

### Common Issues

1. **Backend won't start**
   - Check Python version (3.8+)
   - Verify virtual environment is activated
   - Check all dependencies are installed

2. **Frontend can't connect to backend**
   - Ensure backend is running on port 8000
   - Check CORS configuration
   - Verify API endpoints are correct

3. **OpenAI API errors**
   - Verify API key is valid
   - Check API quota and billing
   - Ensure correct model name

4. **Memory not working**
   - Check FAISS installation
   - Verify embedding model is accessible
   - Check file permissions for memory storage

### Getting Help

- Check the logs for detailed error messages
- Verify all environment variables are set
- Ensure all dependencies are compatible
- Test API endpoints directly with curl or Postman

## Future Enhancements

- [ ] Multi-user support with authentication
- [ ] Pinecone integration for cloud storage
- [ ] More sophisticated memory summarization
- [ ] Voice input/output support
- [ ] Mobile app
- [ ] Advanced analytics dashboard
- [ ] Memory export/import functionality
- [ ] Custom memory categories
- [ ] Integration with other AI models

---

Built with using FastAPI, React, and modern AI technologies
