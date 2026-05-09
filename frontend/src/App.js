import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sun, Moon, MessageCircle, Brain, Settings, LogIn } from 'lucide-react';
import Login from './pages/Login';
import Chat from './pages/Chat';
import MemoryDashboard from './pages/MemoryDashboard';
import './index.css';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // Check for saved authentication
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-3">
                  <Brain className="w-8 h-8 text-emerald-500" />
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Memoria
                  </h1>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Welcome, {user?.name || 'User'}
                  </span>
                  
                  <button
                    onClick={toggleDarkMode}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {darkMode ? (
                      <Sun className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <Moon className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Navigation */}
          <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex space-x-8">
                <a
                  href="/chat"
                  className="flex items-center space-x-2 px-3 py-4 text-sm font-medium text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat</span>
                </a>
                <a
                  href="/memory"
                  className="flex items-center space-x-2 px-3 py-4 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <Brain className="w-4 h-4" />
                  <span>Memory Dashboard</span>
                </a>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/chat" element={<Chat user={user} />} />
              <Route path="/memory" element={<MemoryDashboard user={user} />} />
              <Route path="*" element={<Navigate to="/chat" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
