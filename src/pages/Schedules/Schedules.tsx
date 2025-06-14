/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import PageMeta from "../../utils/common/PageMeta";
import PageBreadcrumb from "../../utils/common/PageBreadCrumb";
import Button from "../../utils/ui/button/Button";
import Alert from "../../utils/ui/alert/Alert";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { motion } from "framer-motion";
import { getToken } from "@/utils/auth/auth";

interface ScheduledMessage {
  id: number;
  message: string;
  recipients: string[];
  scheduledTime: Date;
  status: 'pending' | 'sent' | 'failed';
  aiGenerated: boolean;
}


// Utility function to generate AI response (Gemini-style)
const generateAIResponse = async (prompt: string): Promise<{ message: string; scheduledTime: Date }> => {
  const GEMINI_API_KEY = "AIzaSyBefEfnVTBw2BjHSoPgRx372NEuxh0irbM";
  const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Create a brief and engaging SMS message (max 160 characters) for this scenario: ${prompt}
                   Requirements:
                   - Keep it short and impactful
                   - No asterisks or formatting marks
                   - Only include emojis if specifically mentioned in the prompt
                   - Focus on clear, direct communication
                   - Make it conversational and friendly`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      console.error('API Response:', await response.text());
      throw new Error('Failed to generate AI response');
    }

    const data = await response.json();
    
    // The response format changed in v1
    const generatedText = data.candidates[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      throw new Error('Invalid response format from API');
    }

    // Extract time information from the prompt
    const timeKeywords = {
      'morning': 9,
      'afternoon': 14,
      'evening': 18,
      'night': 20,
      'noon': 12,
      'midnight': 0,
      'dawn': 6,
      'dusk': 17
    };

    let hour = 12; // default hour
    Object.entries(timeKeywords).forEach(([keyword, h]) => {
      if (prompt.toLowerCase().includes(keyword)) {
        hour = h;
      }
    });

    // Smart date inference
    const date = new Date();
    const dayKeywords = {
      'tomorrow': 1,
      'next week': 7,
      'weekend': date.getDay() <= 5 ? 6 - date.getDay() : 13 - date.getDay(),
      'month end': new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() - date.getDate()
    };

    Object.entries(dayKeywords).forEach(([keyword, days]) => {
      if (prompt.toLowerCase().includes(keyword)) {
        date.setDate(date.getDate() + days);
      }
    });
    
    date.setHours(hour, 0, 0, 0);

    return {
      message: generatedText,
      scheduledTime: date
    };
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error('Failed to generate AI message');
  }
};

// Phone number validation helper
const formatUgandanPhoneNumber = (number: string): { isValid: boolean; formattedNumber: string | null; error?: string } => {
  const cleaned = number.replace(/[^\d+]/g, "");
  if (!cleaned) return { isValid: false, formattedNumber: null, error: "Phone number cannot be empty" };

  if (cleaned.startsWith("+256") && cleaned.length === 13 && (cleaned.startsWith("+2567") || cleaned.startsWith("+2564"))) {
    return { isValid: true, formattedNumber: cleaned };
  }
  if (cleaned.startsWith("256") && cleaned.length === 12 && (cleaned.startsWith("2567") || cleaned.startsWith("2564"))) {
    return { isValid: true, formattedNumber: "+" + cleaned };
  }
  if (cleaned.startsWith("0") && cleaned.length === 10 && (cleaned[1] === "7" || cleaned[1] === "4")) {
    return { isValid: true, formattedNumber: "+256" + cleaned.substring(1) };
  }
  if ((cleaned.startsWith("7") || cleaned.startsWith("4")) && cleaned.length === 9) {
    return { isValid: true, formattedNumber: "+256" + cleaned };
  }
  return { isValid: false, formattedNumber: null, error: "Invalid phone number format. Use +2567XXXXXXXX, 07XXXXXXXX, or 7XXXXXXXX" };
};

// SMS sending function
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

function Schedules() {
  const [message, setMessage] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [schedules, setSchedules] = useState<ScheduledMessage[]>(() => {
    const saved = localStorage.getItem('scheduledMessages');
    return saved ? JSON.parse(saved, (key, value) => {
      if (key === 'scheduledTime') return new Date(value);
      return value;
    }) : [];
  });
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    const savedView = localStorage.getItem('schedulesViewMode');
    return savedView === 'list' ? 'list' : 'grid'; // Default to grid if not set
  });
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<ScheduledMessage | null>(null);

  // Auto-dismiss alerts after 2 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Save schedules to localStorage
  useEffect(() => {
    localStorage.setItem('scheduledMessages', JSON.stringify(schedules));
  }, [schedules]);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('schedulesViewMode', viewMode);
  }, [viewMode]);

  // AI Schedule Generation
  const generateScheduleWithAI = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const response = await generateAIResponse(prompt);
      setMessage(response.message);
      setScheduledTime(response.scheduledTime);
      setShowAIModal(false);
      setShowScheduleDialog(true);
      setAiPrompt("");
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Failed to generate schedule with AI. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Refresh status of pending schedules and send messages
  useEffect(() => {
    const checkScheduleStatus = async () => {
      const now = new Date();
      for (const schedule of schedules) {
        if (schedule.status === 'pending' && new Date(schedule.scheduledTime) <= now) {
          try {
            await sendSMS(schedule.recipients, schedule.message);
            setSchedules(prev => prev.map(s => 
              s.id === schedule.id ? { ...s, status: 'sent' } : s
            ));
            setAlert({
              type: 'success',
              message: `Message successfully sent to ${schedule.recipients.length} recipient(s)!`
            });
          } catch (error) {
            console.error('Failed to send scheduled message:', error);
            setSchedules(prev => prev.map(s => 
              s.id === schedule.id ? { ...s, status: 'failed' } : s
            ));
            setAlert({
              type: 'error',
              message: `Failed to send scheduled message: ${error instanceof Error ? error.message : "Unknown error"}`
            });
          }
        }
      }
    };
    
    const interval = setInterval(checkScheduleStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [schedules]);

  const handleSchedule = () => {
    if (!message || !scheduledTime || recipients.length === 0) {
      setAlert({
        type: 'error',
        message: 'Please fill in all required fields.',
      });
      return;
    }

    // Validate all phone numbers
    const validatedRecipients = recipients.map(number => formatUgandanPhoneNumber(number.trim()));
    const invalidNumbers = validatedRecipients.filter(r => !r.isValid);
    
    if (invalidNumbers.length > 0) {
      setAlert({
        type: 'error',
        message: `Invalid phone numbers detected: ${invalidNumbers.map(n => n.error).join(', ')}`,
      });
      return;
    }

    try {
      // Add to local state
      const newSchedule: ScheduledMessage = {
        id: editingSchedule?.id || Date.now(),
        message,
        recipients: validatedRecipients.map(r => r.formattedNumber!).filter(Boolean),
        scheduledTime,
        status: 'pending',
        aiGenerated: Boolean(aiPrompt),
      };

      setSchedules(prev => 
        editingSchedule 
          ? prev.map(s => s.id === editingSchedule.id ? newSchedule : s)
          : [...prev, newSchedule]
      );

      // Reset form
      setMessage("");
      setRecipients([]);
      setScheduledTime(null);
      setAiPrompt("");
      setEditingSchedule(null);
      setShowScheduleDialog(false);
      setAlert({
        type: 'success',
        message: `Message successfully ${editingSchedule ? 'updated' : 'scheduled'}!`,
      });
    } catch {
      setAlert({
        type: 'error',
        message: 'Failed to schedule message. Please try again.',
      });
    }
  };

  function stopPropagation() {
    throw new Error("Function not implemented.");
  }

  return (
    <>
      <PageMeta title="Schedule Messages" description="Schedule and automate your SMS messages" />
      <PageBreadcrumb pageTitle={""}      
        // breadcrumbs={[
        //   { name: "Dashboard", href: "/" },
        //   { name: "Schedules", href: "/schedules" },
        // ]}
      />

      <div className="mx-auto max-w-6xl px-4 py-8">
        {alert && (
          <div className="mb-4">
            <Alert
              variant={alert.type}
              title={alert.type === 'success' ? 'Success' : 'Error'}
              message={alert.message}
            />
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Scheduled Messages</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white dark:bg-gray-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white dark:bg-gray-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3h7v7H3V3zM14 3h7v7h-7V3zM14 14h7v7h-7v-7zM3 14h7v7H3v-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  onClick={() => setShowScheduleDialog(true)
                  }
                  className="flex items-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  New Schedule
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAIModal(true)}
                  className="flex items-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 3H4.5C3.67157 3 3 3.67157 3 4.5V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M8 21H4.5C3.67157 21 3 20.3284 3 19.5V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M16 3H19.5C20.3284 3 21 3.67157 21 4.5V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M16 21H19.5C20.3284 21 21 20.3284 21 19.5V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Use LucoAI
                </Button>
              </div>
            </div>
          </div>

          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {schedules.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16">
                <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 2v4M16 2v4M3.5 9h17M21 8v9a5 5 0 01-5 5H8a5 5 0 01-5-5V8a5 5 0 015-5h8a5 5 0 015 5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">No scheduled messages</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-4 text-center max-w-sm">
                  Create your first scheduled message by clicking the "New Schedule" button above
                </p>
                <Button
                  variant="primary"
                  onClick={() => setShowScheduleDialog(true)}
                  className="flex items-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  New Schedule
                </Button>
              </div>
            ) : (
              schedules.map((schedule) => (
                <motion.div
                  key={schedule.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}
                >
                  <div className={`flex-1 p-4 ${viewMode === 'list' ? 'flex gap-4 items-center' : ''}`}>
                    <div className={viewMode === 'list' ? 'flex-1' : ''}>
                      <p className="text-sm text-gray-800 dark:text-white mb-2 line-clamp-2">{schedule.message}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                          <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                            <circle cx="10" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          {schedule.recipients.length} recipients
                        </span>
                        <span className="inline-flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                          <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 8v4l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          {new Date(schedule.scheduledTime).toLocaleString()}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full ${
                          schedule.status === 'sent' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                          schedule.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                          'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {schedule.status}
                        </span>
                        {schedule.aiGenerated && (
                          <span className="inline-flex items-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                            <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            AI Generated
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 ${viewMode === 'list' ? '' : 'mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'}`}>
                      {schedule.status === 'pending' && !showScheduleDialog ? (
                        <>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setMessage(schedule.message);
                              setRecipients(schedule.recipients);
                              setScheduledTime(new Date(schedule.scheduledTime));
                              setShowScheduleDialog(true);
                              setEditingSchedule(schedule);
                            }}
                          >
                            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 text-red-500 hover:text-red-600"
                            onClick={() => setEditingSchedule(schedule)}
                          >
                            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Cancel
                          </Button>
                        </>
                      ) : schedule.status !== 'pending' ? (
                        <Button
                          variant="outline"
                          className="flex-1 text-red-500 hover:text-red-600"
                          onClick={() => setEditingSchedule(schedule)}
                        >
                          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Schedule Dialog */}
      {showScheduleDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-xl bg-white p-6 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {editingSchedule ? 'Edit Schedule' : 'New Schedule'}
              </h4>
              <button
                onClick={() => {
                  setShowScheduleDialog(false);
                  setEditingSchedule(null);
                  setMessage("");
                  setRecipients([]);
                  setScheduledTime(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message
                </label>
                <div className="relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                    rows={4}
                    maxLength={160}
                    placeholder="Enter your message here..."
                  />
                  <div className={`absolute bottom-2 right-2 text-xs ${
                    message.length > 150 ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {message.length}/160
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Recipients (comma-separated)
                </label>
                <input
                  type="text"
                  value={recipients.join(", ")}
                  onChange={(e) => setRecipients(e.target.value.split(",").map(r => r.trim()))}
                  className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g., +256701234567, +256787654321"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Schedule Time
                </label>
                <DatePicker
                  selected={scheduledTime}
                  onChange={(date) => setScheduledTime(date)}
                  showTimeSelect
                  dateFormat="MMMM d, yyyy h:mm aa"
                  minDate={new Date()}
                  className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholderText="Select date and time"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  onClick={() => {
                    setShowScheduleDialog(false);
                    setEditingSchedule(null);
                    setMessage("");
                    setRecipients([]);
                    setScheduledTime(null);
                  }}
                  variant="outline"
                  className="px-4"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSchedule}
                  variant="primary"
                  className="px-4"
                  disabled={!message || !scheduledTime || recipients.length === 0}
                >
                  {editingSchedule ? 'Update Schedule' : 'Schedule Message'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* AI Schedule Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-xl bg-white p-6 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Schedule with LucoAI
              </h4>
              <button
                onClick={() => setShowAIModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Describe your schedule needs
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="E.g., Schedule a promotional message for our weekend sale, targeting customers in the evening"
                  className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setShowAIModal(false)}
                  variant="outline"
                  className="px-4"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => generateScheduleWithAI(aiPrompt)}
                  variant="primary"
                  className="px-4"
                  disabled={!aiPrompt.trim() || isGenerating}
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Generating...
                    </div>
                  ) : (
                    'Generate Schedule'
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {editingSchedule && !showScheduleDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-xl bg-white p-6 dark:bg-gray-900"
          >
            <div className="text-center">
              <svg className="mx-auto w-12 h-12 text-red-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9v4M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Cancel Schedule</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to cancel this scheduled message? This action cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setEditingSchedule(null)}
                  className="px-4"
                >
                  No, Keep It
                </Button>
                <Button
                  variant="primary"
                  className="px-4 bg-red-500 hover:bg-red-600"
                  onClick={() => {
                    setSchedules(schedules.filter(s => s.id !== editingSchedule?.id));
                    setEditingSchedule(null);
                    setAlert({
                      type: 'success',
                      message: 'Schedule cancelled successfully'
                    });
                  }}
                >
                  Yes, Cancel It
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

export default Schedules;