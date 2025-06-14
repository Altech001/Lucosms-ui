import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from "@clerk/clerk-react";
import knowledge from '../../data/lucobot-knowledge.json';
import { BotKnowledge } from '@/types/botTypes';
import { getGeminiResponse } from '@/utils/gemini';
import Alert from '@/components/AlertBanner';

interface Message {
  text: string;
  sender: "user" | "bot";
  timestamp?: number;
}

function LucoBot() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [showPhoneInput, setShowPhoneInput] = useState(true);
  const [alert, setAlert] = useState<{ variant: "success" | "error"; title: string; message: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(`lucobot_messages_${phoneNumber}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { getToken } = useAuth();
  const knowledgeBase = knowledge as BotKnowledge;

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (phoneNumber && messages.length > 0) {
      localStorage.setItem(`lucobot_messages_${phoneNumber}`, JSON.stringify(messages));
    }
  }, [messages, phoneNumber]);

  // Load messages when phone number changes
  useEffect(() => {
    if (phoneNumber) {
      try {
        const saved = localStorage.getItem(`lucobot_messages_${phoneNumber}`);
        if (saved) {
          const parsedMessages = JSON.parse(saved);
          setMessages(parsedMessages);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    }
  }, [phoneNumber]);

  const sendSMS = async (recipients: string[], message: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/send_sms`, {
        method: "POST",
        headers: { 
          'Authorization': `Bearer ${token}`,
        "accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: recipients, message }),
      });

      const responseData = await response.json();
      if (!response.ok || responseData.status !== "success") {
        throw new Error(responseData.message || "Failed to send SMS");
      }
      return responseData;
    } catch (error) {
      throw new Error(`Error sending SMS: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const sendConversationToAdmin = async () => {
    if (messages.length === 0) return;

    const conversationText = messages
      .map(msg => `${msg.sender}: ${msg.text}`)
      .join('\n');
    
    const summary = `Chat Summary from ${phoneNumber}:
Total Messages: ${messages.length}
Time: ${new Date().toLocaleString()}
\n---\n${conversationText}`;

    try {
      const response = await sendSMS(
        ['+256708215305'],
        summary
      );
      console.log('Chat history sent successfully:', response);
    } catch (error) {
      console.error('Error sending chat history:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleClose = async () => {
    if (messages.length > 0) {
      await sendConversationToAdmin();
    }
    setIsVisible(false);
  };

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      try {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'auto'
        });
      } catch {
        // Fallback for older browsers
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }
  }, []);

  // Force scroll after messages update
  useEffect(() => {
    // Immediate scroll
    scrollToBottom();
    // Delayed scroll to handle dynamic content
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  // Additional scroll trigger for when bot is typing
  useEffect(() => {
    if (isTyping) {
      scrollToBottom();
      const timer = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timer);
    }
  }, [isTyping, scrollToBottom]);

  // Scroll on initial load
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  const handlePhoneNumberSubmit = useCallback(() => {
    if (phoneNumber.trim() !== '') {
      setShowPhoneInput(false);
      const menuItems = Object.entries(knowledgeBase.menuOptions)
        .map(([id, option]) => `${id}. ${option.title}`)
        .join('\n');
      const welcomeMessage = `Welcome to the LucoSMS Help Center! 🤖\nHow can I assist you today?\n\nHere are some topics I can help with:\n${menuItems}\n\nPlease type a number or describe your question.`;
      setMessages([{ 
        text: welcomeMessage,
        sender: 'bot',
        timestamp: Date.now()
      }]);
      scrollToBottom();
    } else {
      alert('Please enter your phone number.');
    }
  }, [phoneNumber, knowledgeBase.menuOptions, scrollToBottom]);

  const findBotResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase().trim();
    
    // Try Gemini API first
    const geminiResponse = await getGeminiResponse(userMessage, knowledgeBase);
    if (geminiResponse) {
      return geminiResponse;
    }
    
    // Fallback to knowledge base if Gemini fails
    // Direct number input for menu options
    if (/^[1-5]$/.test(userMessage)) {
      return knowledgeBase.menuOptions[userMessage]?.response || getDefaultResponse();
    }

    // Check for greetings
    if (knowledgeBase.quickResponses.greetings.keywords.some(k => lowerMessage.includes(k.toLowerCase()))) {
      const responses = knowledgeBase.quickResponses.greetings.responses;
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // Check for farewell
    if (knowledgeBase.quickResponses.farewell.keywords.some(k => lowerMessage.includes(k.toLowerCase()))) {
      const responses = knowledgeBase.quickResponses.farewell.responses;
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // Check for keywords with highest match priority
    let bestMatch = {
      response: "",
      matchCount: 0
    };

    // Check keywords
    Object.values(knowledgeBase.keywords).forEach(keywordData => {
      const matchCount = keywordData.matches.filter(k => 
        lowerMessage.includes(k.toLowerCase())
      ).length;
      if (matchCount > bestMatch.matchCount) {
        bestMatch = {
          response: keywordData.response,
          matchCount
        };
      }
    });

    if (bestMatch.matchCount > 0) {
      return bestMatch.response;
    }

    // Check common questions with partial matching
    Object.entries(knowledgeBase.commonQuestions).forEach(([key, data]) => {
      const matchCount = key.toLowerCase().split(" ").filter(word => 
        lowerMessage.includes(word)
      ).length;
      if (matchCount > bestMatch.matchCount) {
        bestMatch = {
          response: data.response,
          matchCount
        };
      }
    });

    if (bestMatch.matchCount > 0) {
      return bestMatch.response;
    }

    // Default response with menu
    return "I'm not sure about that. Here are the topics I can help with:\n" +
           Object.entries(knowledgeBase.menuOptions)
             .map(([id, option]) => `${id}. ${option.title}`)
             .join('\n');
  };

  const getDefaultResponse = (): string => {
    const menuItems = Object.entries(knowledgeBase.menuOptions)
      .map(([id, option]) => `${id}. ${option.title}`)
      .join('\n');
    return "I'm not sure I understand. Here are the topics I can help with:\n" + menuItems + "\n\nPlease choose a topic or rephrase your question.";
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;

    const userMessage: Message = { 
      text: inputMessage, 
      sender: "user",
      timestamp: Date.now()
    };
    
    setInputMessage(''); // Clear input first
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    
    // Force scroll after user message
    scrollToBottom();
    
    try {
      const botResponseText = await findBotResponse(inputMessage);
      const botMessage: Message = { 
        text: botResponseText || getDefaultResponse(), 
        sender: "bot",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMessage]);
      // Force scroll after bot response
      scrollToBottom();
    } catch (error) {
      console.error('Error getting bot response:', error);
      const errorMessage: Message = {
        text: "I apologize, but I'm having trouble responding right now. Please try again.",
        sender: "bot",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      // Final scroll after typing indicator is removed
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleDownloadConversation = () => {
    const conversationText = messages.map(msg => `${msg.sender}: ${msg.text}`).join('\n');
    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'conversation.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-full sm:w-[380px] flex flex-col bg-white/95 border-l border-gray-100 dark:bg-gray-900/95 dark:border-gray-800 z-[999]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100/50 dark:border-gray-800/50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-brand-50/50 dark:bg-brand-900/25 flex items-center justify-center">
            <svg className="w-4 h-4 text-brand-500/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4-4-4z" />
            </svg>
          </div>
          <h2 className="text-base font-medium text-gray-800 dark:text-white">LucoBot</h2>
        </div>
        <div className="flex items-center space-x-2">
          {!showPhoneInput && (
            <>
              <button 
                onClick={() => {
                  localStorage.removeItem(`lucobot_messages_${phoneNumber}`);
                  setMessages([]);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                title="Clear Conversation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button 
                onClick={handleDownloadConversation}
                className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                title="Download Conversation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </>
          )}
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
            title="Close Bot"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col relative h-[calc(100vh-64px)]">
        {showPhoneInput ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-sm">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-900/50 flex items-center justify-center">
                    <svg className="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4-4-4z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Welcome to LucoBot
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Please enter your phone number to start chatting with our AI assistant
                </p>
              </div>
              <div className="space-y-4">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:text-white dark:placeholder-gray-400"
                  maxLength={15}
                />
                <button 
                  onClick={handlePhoneNumberSubmit}
                  className="w-full px-4 py-2.5 text-white bg-brand-500 rounded-xl hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:ring-offset-2 transition-colors duration-200 font-medium"
                >
                  Start Chatting
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-3 sm:space-y-4"
              style={{ 
                height: 'calc(100vh - 180px)',
                maxHeight: 'calc(100vh - 180px)',
                paddingBottom: '80px',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(99, 102, 241, 0.4) transparent'
              }}
            >
              {messages.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-xl p-2.5 sm:px-4 sm:py-2.5 ${
                      msg.sender === 'user' 
                        ? 'bg-brand-500/90 text-white backdrop-blur-sm' 
                        : 'bg-gray-50/80 text-gray-800 dark:bg-gray-800/80 dark:text-white backdrop-blur-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-xl p-2.5 sm:px-4 sm:py-2.5 bg-gray-50/80 text-gray-800 dark:bg-gray-800/80 dark:text-white backdrop-blur-sm">
                    <p className="text-sm">typing...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-[1px]" />
            </div>

            {/* Input */}
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-white/95 dark:bg-gray-900/95 border-t border-gray-100/50 dark:border-gray-800/50">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:text-white dark:placeholder-gray-400"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button 
                  onClick={handleSendMessage}
                  className="px-4 py-2.5 text-white bg-brand-500/90 rounded-xl hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:ring-offset-2 transition-all duration-200 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!inputMessage.trim()}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default LucoBot;
