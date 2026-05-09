import React, { useState } from 'react';
import { Brain, User, Mail, ArrowRight } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate authentication (in production, this would be a real API call)
    setTimeout(() => {
      const userData = {
        id: 'user_' + Date.now(),
        name: formData.name,
        email: formData.email,
        preferences: {
          theme: 'light',
          notifications: true
        }
      };
      
      onLogin(userData);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-emerald-500 rounded-full shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Memoria
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your AI companion that remembers everything
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                  placeholder="Enter your name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-600 focus:ring-4 focus:ring-emerald-200 dark:focus:ring-emerald-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Start Chatting</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Features */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="text-center">
                <div className="text-emerald-500 font-semibold text-lg mb-1">∞</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Memory</div>
              </div>
              <div className="text-center">
                <div className="text-emerald-500 font-semibold text-lg mb-1">24/7</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Available</div>
              </div>
              <div className="text-center">
                <div className="text-emerald-500 font-semibold text-lg mb-1">AI</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Powered</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            By continuing, you agree to our terms and privacy policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
