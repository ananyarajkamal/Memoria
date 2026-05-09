import React, { useState, useEffect } from 'react';
import { Brain, Search, Trash2, BarChart3, Clock, MessageSquare, Database, AlertCircle } from 'lucide-react';

const MemoryDashboard = ({ user }) => {
  const [memories, setMemories] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMemories();
    fetchStats();
  }, []);

  const fetchMemories = async () => {
    try {
      const response = await fetch('http://localhost:8000/memories');
      if (!response.ok) throw new Error('Failed to fetch memories');
      const data = await response.json();
      setMemories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/memories/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const searchMemories = async (query) => {
    if (!query.trim()) {
      fetchMemories();
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/memories/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, k: 10 })
      });
      
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setMemories(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const clearAllMemories = async () => {
    if (!window.confirm('Are you sure you want to clear all memories? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/memories', {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to clear memories');
      
      setMemories([]);
      fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteMemory = async (index) => {
    try {
      const response = await fetch(`http://localhost:8000/memories/${index}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete memory');
      
      fetchMemories();
      fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Memory Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage your AI assistant's memory
          </p>
        </div>
        
        <button
          onClick={clearAllMemories}
          className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear All</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Conversations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.total_conversations}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vector Index Size</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.index_size}
                </p>
              </div>
              <Database className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Embedding Dimension</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.embedding_dimension}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchMemories(e.target.value);
            }}
            placeholder="Search memories..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Memories List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Stored Memories ({memories.length})
          </h3>
        </div>
        
        {memories.length === 0 ? (
          <div className="p-8 text-center">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No memories found. Start chatting to build your memory!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {memories.map((memory, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTimestamp(memory.timestamp)}
                      </span>
                      {memory.similarity_score && (
                        <span className="text-xs bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded">
                          {(memory.similarity_score * 100).toFixed(1)}% match
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {truncateText(memory.content)}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteMemory(index)}
                    className="ml-4 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryDashboard;
