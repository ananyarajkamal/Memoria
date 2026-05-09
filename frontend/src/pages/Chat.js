import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, Brain, Trash2, Paperclip, X, FileText, Image as ImageIcon, Mic, Volume2, Camera } from 'lucide-react';
import { chatService } from '../services/chatService';

const Chat = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [usedMemories, setUsedMemories] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!inputMessage.trim() && !uploadedFile) || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim() || (uploadedFile ? `[File: ${uploadedFile.name}]` : ''),
      timestamp: new Date().toISOString(),
      hasFile: !!uploadedFile,
      fileName: uploadedFile?.name,
      imagePreview: uploadedFile?.imagePreview,
      isImage: uploadedFile?.isImage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingMessage('');
    setUsedMemories([]);

    try {
      let response;
      
      if (uploadedFile) {
        // Upload file with message
        const formData = new FormData();
        formData.append('file', uploadedFile);
        if (inputMessage.trim()) {
          formData.append('message', inputMessage.trim());
        }

        response = await fetch('http://localhost:8000/upload/chat', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error('File upload failed');
        
        const data = await response.json();
        
        setIsStreaming(false);
        setIsLoading(false);
        
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: data.response,
          timestamp: new Date().toISOString(),
          memoriesUsed: data.memories_used || []
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setUploadedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        // Regular text message
        response = await fetch('http://localhost:8000/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: inputMessage.trim(),
            user_id: user.id
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
                
                if (data.chunk) {
                  fullResponse += data.chunk;
                  setStreamingMessage(fullResponse);
                }
                
                if (data.memories_used) {
                  setUsedMemories(data.memories_used);
                }
                
                if (data.complete) {
                  setIsStreaming(false);
                  setIsLoading(false);
                  
                  const aiMessage = {
                    id: Date.now() + 1,
                    type: 'ai',
                    content: fullResponse,
                    timestamp: new Date().toISOString(),
                    memoriesUsed: data.memories_used || []
                  };
                  
                  setMessages(prev => [...prev, aiMessage]);
                  setStreamingMessage('');
                  setUsedMemories([]);
                }
              } catch (e) {
                console.error('Error parsing chunk:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingMessage('');
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setUsedMemories([]);
    setStreamingMessage('');
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create image preview URL if it's an image
      const isImage = file.type.match(/^image\/(jpg|jpeg|png|gif|webp)$/i) || 
                      file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
      if (isImage) {
        const previewUrl = URL.createObjectURL(file);
        // Create a custom file object with extra properties
        const enhancedFile = Object.assign(file, {
          imagePreview: previewUrl,
          isImage: true,
          originalName: file.name
        });
        setUploadedFile(enhancedFile);
      } else {
        const enhancedFile = Object.assign(file, {
          isImage: false,
          originalName: file.name
        });
        setUploadedFile(enhancedFile);
      }
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (filename) => {
    if (!filename) return <FileText className="w-5 h-5 text-gray-500" />;
    const ext = filename.toLowerCase();
    if (ext.endsWith('.pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (ext.match(/\.(doc|docx)$/)) return <FileText className="w-5 h-5 text-blue-600" />;
    if (ext.match(/\.(jpg|jpeg|png|gif|webp)$/)) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  // Image Analysis
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setUploadedFile(file);

    // Create image preview URL
    const imagePreviewUrl = URL.createObjectURL(file);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('message', inputMessage);

      const response = await fetch('http://localhost:8000/analyze-image', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Image analysis failed');

      const data = await response.json();

      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: inputMessage || '',
        timestamp: new Date().toISOString(),
        hasImage: true,
        fileName: file.name,
        imagePreview: imagePreviewUrl
      };

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: data.response,
        timestamp: new Date().toISOString(),
        memoriesUsed: data.memories_used || []
      };

      setMessages(prev => [...prev, userMessage, aiMessage]);
      setInputMessage('');
    } catch (error) {
      console.error('Error analyzing image:', error);
      // Clean up preview URL on error
      URL.revokeObjectURL(imagePreviewUrl);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Sorry, I could not analyze the image. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setUploadedFile(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  // Voice Assistant - Speech to Text
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please use Chrome.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(prev => prev + ' ' + transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Text to Speech
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
          <div className="p-4 space-y-4">
            {messages.length === 0 && !isStreaming && (
              <div className="text-center py-12">
                <Bot className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Start a conversation
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  I remember our conversations and use them to provide better responses.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} message-enter`}
              >
                <div className={`flex items-start space-x-3 max-w-3xl ${
                  message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-5 h-5" />
                    ) : (
                      <Bot className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className={`px-4 py-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-emerald-500 text-white'
                      : message.isError
                      ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}>
                    {/* Show uploaded image preview */}
                    {message.imagePreview && (
                      <div className="mb-3">
                        <img 
                          src={message.imagePreview}
                          alt={message.fileName || 'Uploaded image'}
                          className="max-w-full rounded-lg shadow-md"
                          style={{ maxHeight: '200px' }}
                        />
                      </div>
                    )}
                    
                    {/* Show image icon for image messages without preview */}
                    {(message.hasImage || message.isImage) && !message.imagePreview && (
                      <div className="flex items-center space-x-2 mb-2 text-sm opacity-75">
                        <ImageIcon className="w-4 h-4" />
                        <span>{message.fileName}</span>
                      </div>
                    )}
                    
                    {/* Show file icon for non-image files */}
                    {message.hasFile && !message.isImage && !message.imagePreview && (
                      <div className="flex items-center space-x-2 mb-2 text-sm opacity-75">
                        {getFileIcon(message.fileName)}
                        <span>{message.fileName}</span>
                      </div>
                    )}
                    
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Timestamp and Speak Button */}
                    <div className={`flex items-center justify-between mt-2 ${
                      message.type === 'user' 
                        ? 'text-emerald-100' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      <span className="text-xs">{formatTimestamp(message.timestamp)}</span>
                      
                      {/* Speak button for AI messages */}
                      {message.type === 'ai' && !message.isError && (
                        <button
                          type="button"
                          onClick={() => isSpeaking ? stopSpeaking() : speakText(message.content)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                        >
                          {isSpeaking ? (
                            <Volume2 className="w-4 h-4 text-emerald-500 animate-pulse" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Streaming Message */}
            {isStreaming && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3 max-w-3xl">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
                    <p className="whitespace-pre-wrap">{streamingMessage}</p>
                    <div className="flex space-x-1 mt-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Memory Context */}
        {usedMemories.length > 0 && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-emerald-700 dark:text-emerald-400">
              <Brain className="w-4 h-4" />
              <span>Using {usedMemories.length} relevant memories</span>
            </div>
          </div>
        )}

        {/* Input Area */}
        {uploadedFile && (
          <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            {uploadedFile.imagePreview ? (
              <div className="flex items-start space-x-3">
                <img 
                  src={uploadedFile.imagePreview}
                  alt={uploadedFile.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <p className="text-sm text-blue-700 dark:text-blue-400 truncate">{uploadedFile.name}</p>
                  <p className="text-xs text-blue-500">({(uploadedFile.size / 1024).toFixed(1)} KB)</p>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-blue-500" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getFileIcon(uploadedFile.name)}
                  <span className="text-sm text-blue-700 dark:text-blue-400 truncate max-w-xs">
                    {uploadedFile.name}
                  </span>
                  <span className="text-xs text-blue-500 dark:text-blue-400">
                    ({(uploadedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-blue-500" />
                </button>
              </div>
            )}
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          {/* Hidden file inputs */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.txt,.md,.csv,.json,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx"
            disabled={isLoading}
          />
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleImageSelect}
            className="hidden"
            accept=".jpg,.jpeg,.png,.gif,.webp"
            disabled={isLoading}
          />
          
          {/* File Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="px-3 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            title="Upload file (PDF, Image, Text)"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          {/* Image Analysis Button */}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={isLoading}
            className="px-3 py-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50"
            title="Analyze image with AI vision"
          >
            <Camera className="w-5 h-5" />
          </button>
          
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={startListening}
            disabled={isLoading || isListening}
            className={`px-3 py-3 rounded-lg transition-colors disabled:opacity-50 ${
              isListening 
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse' 
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
            }`}
            title={isListening ? 'Listening...' : 'Voice input'}
          >
            <Mic className="w-5 h-5" />
          </button>
          
          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={uploadedFile ? "Add a message about the file (optional)..." : "Type your message..."}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-white transition-all duration-200"
            disabled={isLoading}
          />
          
          {/* Send Button */}
          <button
            type="submit"
            disabled={isLoading || (!inputMessage.trim() && !uploadedFile)}
            className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 focus:ring-4 focus:ring-emerald-200 dark:focus:ring-emerald-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
          
          {/* Clear Chat Button */}
          <button
            type="button"
            onClick={clearChat}
            className="px-3 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
