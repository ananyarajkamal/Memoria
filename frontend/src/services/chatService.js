import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.config?.url);
    return Promise.reject(error);
  }
);

export const chatService = {
  // Send a message and get response
  sendMessage: async (message, userId = 'default') => {
    try {
      const response = await api.post('/chat', {
        message,
        user_id: userId
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to send message');
    }
  },

  // Stream response (for real-time chat)
  streamMessage: async (message, userId = 'default', onChunk) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          user_id: userId
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              onChunk(data);
              
              if (data.complete) {
                return data;
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      throw new Error(error.message || 'Failed to stream message');
    }
  },

  // Get all memories
  getMemories: async () => {
    try {
      const response = await api.get('/memories');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch memories');
    }
  },

  // Search memories
  searchMemories: async (query, k = 5) => {
    try {
      const response = await api.post('/memories/search', null, {
        params: { query, k }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to search memories');
    }
  },

  // Clear all memories
  clearMemories: async () => {
    try {
      const response = await api.delete('/memories');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to clear memories');
    }
  },

  // Delete specific memory
  deleteMemory: async (index) => {
    try {
      const response = await api.delete(`/memories/${index}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete memory');
    }
  },

  // Get memory statistics
  getMemoryStats: async () => {
    try {
      const response = await api.get('/memories/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch memory stats');
    }
  },

  // Get memory summary
  getMemorySummary: async () => {
    try {
      const response = await api.get('/memories/summary');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch memory summary');
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Health check failed');
    }
  }
};

export default chatService;
