"use client";
import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, X, Minimize2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

const ChatWidget = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: t.chatbot.welcomeMessage,
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatbotAvailable, setChatbotAvailable] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Determine chatbot base URL (prefer NEXT_PUBLIC_CHATBOT_URL, then NEXT_PUBLIC_BACKEND_URL)
      const baseUrl = (process.env.NEXT_PUBLIC_CHATBOT_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001').replace(/\/+$/, '');

      // Send message to chatbot API
      const response = await fetch(`${baseUrl}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: userMessage.content,
          sender: "user"
        }),
      });

      if (response.ok) {
        const botResponse = await response.json();
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: botResponse.content || 'I received your message!',
          isBot: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        // Non-OK HTTP status from chatbot
        setChatbotAvailable(false);
        throw new Error(`Chatbot responded with status ${response.status}`);
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Network errors (failed to fetch) will be TypeError in browsers
      if (error instanceof TypeError) {
        setChatbotAvailable(false);
      }
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: chatbotAvailable === false
          ? `${t.chatbot.errorMessage} (chatbot backend unreachable)`
          : t.chatbot.errorMessage,
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center"
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`bg-white rounded-lg shadow-2xl transition-all duration-300 ${
        isMinimized ? 'h-16' : 'h-96 w-80'
      }`}>
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle size={20} />
            <span className="font-semibold">{t.chatbot.title}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="hover:bg-blue-700 p-1 rounded"
              aria-label="Minimize chat"
            >
              <Minimize2 size={16} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-700 p-1 rounded"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="h-64 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      message.isBot
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t.chatbot.placeholder}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-base font-medium text-gray-900 dark:text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white shadow-sm transition-all"
                  disabled={isLoading}
                  style={{ color: '#111827' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:bg-gray-300 disabled:from-gray-300 disabled:to-gray-300 text-white p-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-none"
                  aria-label="Send message"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatWidget;