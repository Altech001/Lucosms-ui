import { useState, useRef, useEffect } from 'react';
import { sendMessageToGemini } from '../../lib/api/gemini-api';
import { useAuth } from "@clerk/clerk-react";

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

function LucoBot() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [showPhoneInput, setShowPhoneInput] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { getToken } = useAuth();

  const sendSMS = async (recipients: string[], message: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/send_sms`, {
        method: "POST",
        headers: { 
          'Authorization': `Bearer ${token}`,
          "accept": "application/json", 
          "Content-Type": "application/json" 
        },
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
      await sendSMS(
        ['+256708215305'],
        summary
      );
    } catch (error) {
      console.error('Error sending chat history:', error);
    }
  };

  const handleClose = async () => {
    if (messages.length > 0) {
      await sendConversationToAdmin();
    }
    setIsVisible(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handlePhoneNumberSubmit = () => {
    if (phoneNumber.trim() !== '') {
      setShowPhoneInput(false);
      setMessages([
        { 
          text: 'Welcome to the LucoSMS Help Center! How can I assist you today?\n\n' +
                'Here are some topics I can help with:\n' +
                '1. Sending SMS Messages\n' +
                '2. Managing Contacts\n' +
                '3. Account Balance\n' +
                '4. Message Templates\n' +
                '5. Scheduling Messages\n\n' +
                'Please type a number or describe your question.',
          sender: 'bot' 
        }
      ]);
    } else {
      alert('Please enter your phone number.');
    }
  };

  // Handle sending a message to the bot
  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;

    const userMessage: Message = { text: inputMessage, sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputMessage('');

    try {
      const botResponseText = await sendMessageToGemini(inputMessage);
      const botMessage: Message = { text: botResponseText, sender: 'bot' };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error sending message to Gemini API:', error);
      const errorMessage: Message = { text: 'Error: Could not get a response from the bot.', sender: 'bot' };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
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
    <div className="fixed right-0 top-0 h-screen w-[380px] flex flex-col bg-white/95 backdrop-blur-md border-l border-gray-200/50 dark:bg-gray-900/95 dark:border-gray-800/50 z-[999]">
      {/* Header - Always visible */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-900/50 flex items-center justify-center">
            <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4-4-4z" />
            </svg>
          </div>
          <h2 className="text-base font-medium text-gray-800 dark:text-white">LucoBot</h2>
        </div>
        <div className="flex items-center space-x-2">
          {!showPhoneInput && (
            <button 
              onClick={handleDownloadConversation}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Download Conversation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          )}
          <button
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors rounded-lg"
            title="Close Bot"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col">
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
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:bg-gray-800/50 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
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
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
              {messages.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-xl px-4 py-2.5 ${
                      msg.sender === 'user' 
                        ? 'bg-brand-500 text-white' 
                        : 'bg-gray-50/80 backdrop-blur-sm text-gray-800 dark:bg-gray-800/80 dark:text-white'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 backdrop-blur-md bg-white/50 border-t border-gray-200/50 dark:bg-gray-800/50 dark:border-gray-700/50">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:border-gray-700/50 dark:text-white dark:placeholder-gray-400"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button 
                  onClick={handleSendMessage}
                  className="px-4 py-2.5 text-white bg-brand-500 rounded-xl hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:ring-offset-2 transition-colors duration-200"
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
