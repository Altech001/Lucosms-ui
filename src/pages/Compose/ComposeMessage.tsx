/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router";
import PageMeta from "../../utils/common/PageMeta";
import PageBreadcrumb from "../../utils/common/PageBreadCrumb";
import Alert from "../../utils/ui/alert/Alert";
import Button from "../../utils/ui/button/Button";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { MoreDotIcon } from "../../icons";
import { Dropdown } from "../../utils/ui/dropdown/Dropdown";
import { DropdownItem } from "../../utils/ui/dropdown/DropdownItem";
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useAuth } from "@clerk/clerk-react"


// Define types
interface Contact {
  name: string;
  role: string;
  phoneNumber: string;
  lastActive: string;
}

interface Message {
  content: string;
  timestamp: string;
  recipientCount: number;
  recipients: Contact[];
}

interface Template {
  name: string;
  content: string;
  isFavorite: boolean;
}

// API Functions
const GEMINI_API_KEY = "AIzaSyA08IKrb6jtuvNVEcCcE4c8w96VjbuE0tY";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

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

const validateAndImportNumbers = async (numbers: string[]) => {
  try {
    const prompt = `
      I have a list of potentially invalid Ugandan phone numbers: ${numbers.join(", ")}.
      Extract all valid numbers and convert to +256XXXXXXXXX format (starts with 7 after +256).
      Return ONLY a comma-separated list of valid numbers, no explanation.
    `;
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
      }),
    });

    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    const data = await response.json();
    const validatedText = data.candidates[0].content.parts[0].text.trim();
    const phoneNumbers = validatedText.match(/\+256\d{9}/g) || [];
    return [...new Set(phoneNumbers)];
  } catch (error) {
    throw new Error(`Failed to validate numbers: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};




// Add new utility function for Excel export
const exportToExcel = (messages: Message[]) => {
  const data = messages.map((msg) => ({
    'Message Content': msg.content,
    'Timestamp': msg.timestamp,
    'Recipients Count': msg.recipientCount,
    'Recipients': msg.recipients.map(r => r.phoneNumber).join(', ')
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Messages');
  XLSX.writeFile(wb, `lucosms_msg_report${new Date().toISOString().split('T')[0]}.xlsx`);
};

const MESSAGE_LIMIT = 160;
const COST_PER_MESSAGE = 32; // UGX per message

export default function ComposeMessages() {
  const location = useLocation();
  const selectedTemplate = (location.state as { selectedTemplate?: Template })?.selectedTemplate;

  const [messages, setMessages] = useState<Message[]>(() => {
    const cached = localStorage.getItem('recentMessages');
    return cached ? JSON.parse(cached) : [];
  });
  const [newMessage, setNewMessage] = useState<string>(
    selectedTemplate
      ? selectedTemplate.content.includes("[name]")
        ? selectedTemplate.content.replace("[name]", prompt("Enter the name:") || "User")
        : selectedTemplate.content
      : ""
  );
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [inputNumber, setInputNumber] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddNumberModalOpen, setIsAddNumberModalOpen] = useState(false);
  const [alert, setAlert] = useState<{ variant: "success" | "error"; title: string; message: string } | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [importProgress, setImportProgress] = useState({ total: 0, processed: 0, valid: 0 });
  const [isImporting, setIsImporting] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showMagicModal, setShowMagicModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { getToken } = useAuth();


  const sendSMS = async (recipients: string[], message: string, getToken: () => Promise<string | null>) => {
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

  // Filter contacts based on search query
  const filteredContacts = contacts.filter(
    (contact) => 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phoneNumber.includes(searchQuery)
  );

  // Auto-dismiss alert
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Handle manual number input
  const addRecipient = () => {
    const trimmedValue = inputNumber.trim();
    if (!trimmedValue) return;

    setValidationError("");
    const { isValid, formattedNumber, error } = formatUgandanPhoneNumber(trimmedValue);
    if (isValid && formattedNumber && !selectedContacts.some((c) => c.phoneNumber === formattedNumber)) {
      setSelectedContacts((prev) => [
        ...prev,
        { name: "Unknown", role: "N/A", phoneNumber: formattedNumber, lastActive: "Just now" },
      ]);
      setInputNumber("");
      setIsAddNumberModalOpen(false);
    } else {
      setValidationError(error || "Number already added");
    }
  };

  // Handle selecting contacts
  const handleSelectContact = (contact: Contact) => {
    if (selectedContacts.some(c => c.phoneNumber === contact.phoneNumber)) {
      setSelectedContacts(selectedContacts.filter((c) => c.phoneNumber !== contact.phoneNumber));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };

  // Handle Select All
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts([...filteredContacts]);
    }
    setSelectAll(!selectAll);
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    const totalCost = selectedContacts.length * COST_PER_MESSAGE;
    
    if (balance < totalCost) {
      setAlert({
        variant: "error",
        title: "Insufficient Balance",
        message: `You need ${totalCost} UGX to send this message. Current balance: ${balance} UGX`
      });
      return;
    }

    if (newMessage.length > MESSAGE_LIMIT) {
      setAlert({
        variant: "error",
        title: "Message Too Long",
        message: `Message length exceeds ${MESSAGE_LIMIT} characters limit`
      });
      return;
    }

    if (!newMessage || selectedContacts.length === 0) {
      setAlert({ variant: "error", title: "Error", message: "Select at least one contact and enter a message." });
      return;
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setIsSending(true);
    try {
      const responseData = await sendSMS(
        selectedContacts.map((contact) => contact.phoneNumber),
        newMessage,
        getToken
      );
      const updatedMessages = [
        { content: newMessage, timestamp, recipientCount: selectedContacts.length, recipients: selectedContacts },
        ...messages
      ];
      setMessages(updatedMessages);
      localStorage.setItem('recentMessages', JSON.stringify(updatedMessages.slice(0, 100))); // Cache last 100 messages
      setNewMessage("");
      setSelectedContacts([]);
      setSelectAll(false);
      setAlert({
        variant: "success",
        title: "Message Sent",
        message: `Sent to ${responseData.recipients_count} contacts. Cost: UGX ${responseData.total_cost}`,
      });
      
      // Add slight delay before refresh to ensure alert is seen
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      setAlert({ variant: "error", title: "Error", message: error instanceof Error ? error.message : "Failed to send message." });
    } finally {
      setIsSending(false);
    }
  };

  // Handle message click
  const handleMessageClick = (message: Message) => {
    setSelectedContacts(message.recipients);
    setSelectAll(message.recipients.length === contacts.length);
    setNewMessage(""); // Clear the message input when selecting a previous conversation
  };

  // Handle file upload
  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = e.target?.result;
      if (!data) {
        setIsImporting(false);
        return;
      }

      try {
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json(sheet) as any[];

        const numbers = parsedData
          .map((row) => {
            // Check for common phone number field names
            const phoneField = row.phoneNumber || row.phone || row.mobile || row.contact || row.number || 
                              row["Phone Number"] || row["Mobile Number"] || row["Contact Number"];
            return phoneField ? String(phoneField) : "";
          })
          .filter((num) => /\d/.test(num));
        
        setImportProgress({ total: numbers.length, processed: 0, valid: 0 });
        
        const validNumbers = await validateAndImportNumbers(numbers);
        
        const newContacts: Contact[] = validNumbers.map((num) => ({
          name: "Contact",
          role: "N/A",
          phoneNumber: num as string,
          lastActive: "Just now",
        }));

        const uniqueNewContacts = newContacts.filter(
          (c) => !contacts.some((p) => p.phoneNumber === c.phoneNumber)
        );

        setContacts((prev) => [...prev, ...uniqueNewContacts]);
        setImportProgress({ 
          total: numbers.length, 
          processed: numbers.length, 
          valid: validNumbers.length 
        });
        
        setAlert({ 
          variant: "success", 
          title: "Contacts Imported", 
          message: `Imported ${uniqueNewContacts.length} new contacts from ${file.name}.` 
        });
        
        setTimeout(() => {
          setIsImporting(false);
          setIsImportModalOpen(false);
        }, 1500);
      } catch (error) {
        setIsImporting(false);
        setAlert({ 
          variant: "error", 
          title: "Import Failed", 
          message: `Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}` 
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"], "text/csv": [".csv"] },
    disabled: isImporting
  });

  // Remove a contact from selected list
  const removeSelected = (contact: Contact) => {
    setSelectedContacts(selectedContacts.filter((c) => c.phoneNumber !== contact.phoneNumber));
    if (selectAll) setSelectAll(false);
  };

  // Add function to fetch balance
  const fetchBalance = async () => {
    const token = await getToken();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/user/api/v1/wallet-balance`,{
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await response.json();
      setBalance(data.balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  // Add useEffect to fetch balance
  useEffect(() => {
    fetchBalance();
  }, []);

  // Add function to clear all messages
  const handleClearAllMessages = () => {
    if (window.confirm('Are you sure you want to delete all messages?')) {
      setMessages([]);
      localStorage.removeItem('recentMessages');
    }
  };

  // Add AI message generation function
  const generateAIMessage = async (prompt: string) => {
    try {
      setIsGenerating(true);
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ 
              text: `Generate a Simple professional SMS message for the following prompt: ${prompt}. Keep it under 160 characters.`
            }] 
          }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 200 },
        }),
      });

      const data = await response.json();
      const generatedText = data.candidates[0].content.parts[0].text.trim();
      setNewMessage(generatedText);
      setShowMagicModal(false);
    } catch (error) {
      setAlert({
        variant: "error",
        title: "Generation Failed",
        message: "Failed to generate message. Please try again."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Add typing assistance
  const handleMessageTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout for AI suggestions
    typingTimeoutRef.current = setTimeout(async () => {
      if (value.length > 10) {
        try {
          const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ 
                parts: [{ 
                  text: `Based on this partial SMS: "${value}", suggest a professional completion in 1-2 words:`
                }] 
              }],
              generationConfig: { temperature: 0.3, maxOutputTokens: 50 },
            }),
          });
          const data = await response.json();
          setAiSuggestion(data.candidates[0].content.parts[0].text.trim());
        } catch (error) {
          console.error("Failed to get suggestion:", error);
        }
      } else {
        setAiSuggestion("");
      }
    }, 500);
  };

  // Clean up typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Add emoji click handler
  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <>
      <PageMeta title="LucoSMS - Compose Messages" description="Compose and send SMS messages using LucoSMS." />
      <PageBreadcrumb pageTitle="Compose Messages" />
      
      {alert && (
        <div className="fixed top-20 right-4 z-50 w-80 shadow-lg">
          <Alert variant={alert.variant} title={alert.title} message={alert.message} showLink={false} />
        </div>
      )}

      <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-4">
        {/* Contacts Sidebar */}
        <div className="w-full lg:w-1/3 rounded-lg border border-gray-200 p-4 overflow-hidden flex flex-col shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Contacts ({contacts.length})</h3>
            <div className="flex items-center gap-2">
              <Button 
                variant="primary" 
                className="h-8 px-3 text-xs font-medium"
                onClick={() => setIsAddNumberModalOpen(true)}
              >
                Add Number
              </Button>
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-5" />
                </button>
                <Dropdown isOpen={isDropdownOpen} onClose={() => setIsDropdownOpen(false)} className="w-40 p-2">
                  <DropdownItem 
                    onItemClick={() => setIsImportModalOpen(true)} 
                    className="flex w-full text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                  >
                    Import Contacts
                  </DropdownItem>
                </Dropdown>
              </div>
            </div>
          </div>

          <div className="relative mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>

          <div className="flex items-center mb-2  rounded-md px-3 py-2">
            <input 
              type="checkbox" 
              id="selectAll"
              checked={selectAll} 
              onChange={handleSelectAll} 
              className="w-4 h-4 accent-zinc-500 mr-2 cursor-pointer" 
            />
            <label htmlFor="selectAll" className="text-sm font-medium text-gray-800 dark:text-white/90 cursor-pointer">
              Select All ({filteredContacts.length})
            </label>
            {selectedContacts.length > 0 && (
              <span className="ml-auto text-xs font-medium text-zinc-500">
                {selectedContacts.length} selected
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                <svg className="w-12 h-12 mb-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <p className="text-sm">{searchQuery ? "No matching contacts" : "No contacts available"}</p>
                <button 
                  onClick={() => setIsImportModalOpen(true)}
                  className="mt-2 text-xs text-zinc-50 hover:text-zinc-900 font-medium"
                >
                  Import Contacts
                </button>
              </div>
            ) : (
              filteredContacts.map((contact, index) => (
                <div
                  key={index}
                  className={`flex items-center p-3 ${
                    selectedContacts.some(c => c.phoneNumber === contact.phoneNumber) 
                      ? "bg-brand-50 dark:bg-gray-800" 
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  } cursor-pointer border-b border-gray-100 dark:border-gray-700 rounded-md mb-1`}
                  onClick={() => handleSelectContact(contact)}
                >
                  <input
                    type="checkbox"
                    checked={selectedContacts.some(c => c.phoneNumber === contact.phoneNumber)}
                    onChange={() => handleSelectContact(contact)}
                    className="w-4 h-4 accent-zinc-500 mr-3"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="w-8 h-8 bg-brand-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-brand-600 dark:text-brand-400 font-semibold text-sm mr-3">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">{contact.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{contact.phoneNumber}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Selected Contacts Section */}
          {selectedContacts.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">Selected ({selectedContacts.length})</h4>
                <button 
                  onClick={() => setSelectedContacts([])}
                  className="text-xs text-red-500 hover:text-red-600 font-medium"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
                {selectedContacts.map((contact, index) => (
                  <div key={index} className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1">
                    <span className="text-xs text-gray-800 dark:text-white/90 mr-1">{contact.phoneNumber}</span>
                    <button
                      onClick={() => removeSelected(contact)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="w-full lg:w-2/3 rounded-lg border border-gray-200 flex flex-col shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
              {selectedContacts.length > 0 ? (
                <>
                  Messaging <span className="text-brand-500">{selectedContacts.length}</span> {selectedContacts.length === 1 ? 'contact' : 'contacts'}
                </>
              ) : (
                "New Message"
              )}
            </h4>
          </div>
          
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                <svg className="w-16 h-16 mb-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p className="text-lg font-medium mb-1">No messages yet</p>
                <p className="text-sm text-center max-w-md">
                  Select contacts and send your first message. Your conversation history will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-end mb-2 gap-2">
                  <Button
                    onClick={handleClearAllMessages}
                    variant="outline"
                    className="h-8 px-3 text-xs font-medium flex items-center gap-2 text-red-500 hover:text-red-600"
                  >
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Delete All
                  </Button>
                  <Button
                    onClick={() => exportToExcel(messages)}
                    variant="outline"
                    className="h-8 px-3 text-xs font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Export Messages
                  </Button>
                </div>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className="flex flex-col p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                    onClick={() => handleMessageClick(message)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400 text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center">
                          SMS
                        </div>
                        <div className="ml-2">
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            To {message.recipientCount} {message.recipientCount === 1 ? "contact" : "contacts"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{message.timestamp}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                          </svg>
                        </button>
                        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="rounded-lg bg-white dark:bg-gray-800 p-3 shadow-sm border border-gray-100 dark:border-gray-700">
                      <p className="text-sm text-gray-800 dark:text-white/90 whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {selectedContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-gray-500 dark:text-gray-400">
                <p className="text-sm mb-2">Select contacts to send a message</p>
                <Button 
                  variant="primary" 
                  className="h-9 px-3 text-xs font-medium"
                  onClick={() => setIsAddNumberModalOpen(true)}
                >
                  Add Number
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <textarea
                    value={newMessage}
                    onChange={handleMessageTyping}
                    placeholder="Type your message here..."
                    className={`w-full rounded-lg border ${
                      newMessage.length > MESSAGE_LIMIT ? 'border-red-500' : 'border-gray-200'
                    } p-3 pr-20 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-brand-500`}
                    rows={3}
                    maxLength={MESSAGE_LIMIT}
                  />
                  {aiSuggestion && (
                    <div className="absolute top-3 left-3 text-sm text-gray-400 pointer-events-none">
                      {newMessage}{aiSuggestion}
                    </div>
                  )}
                  <div className="absolute right-3 bottom-3 flex items-center gap-2">
                    <button
                      onClick={() => setShowMagicModal(true)}
                      className="text-gray-400 hover:text-brand-500 transition-colors"
                      type="button"
                      title="Generate message with AI"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 3H4.5C3.67157 3 3 3.67157 3 4.5V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M16 3H19.5C20.3284 3 21 3.67157 21 4.5V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M16 21H19.5C20.3284 21 21 20.3284 21 19.5V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M8 21H4.5C3.67157 21 3 20.3284 3 19.5V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M12 8L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M16 12L8 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        type="button"
                      >
                        😊
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute bottom-10 right-0">
                          <EmojiPicker
                            onEmojiClick={onEmojiClick}
                            theme={Theme.DARK}
                            width={300}
                            height={400}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <span className={newMessage.length > MESSAGE_LIMIT ? 'text-red-500' : ''}>
                      {MESSAGE_LIMIT - newMessage.length} characters remaining
                    </span>
                    {selectedContacts.length > 0 && (
                      <span className="ml-2">
                        • Cost: {selectedContacts.length * COST_PER_MESSAGE} UGX
                      </span>
                    )}
                    <span className="ml-2">
                      • Balance: {balance} UGX
                    </span>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    variant="primary"
                    className="h-10 px-4 flex items-center"
                    disabled={!newMessage || selectedContacts.length === 0 || newMessage.length > MESSAGE_LIMIT || balance < (selectedContacts.length * COST_PER_MESSAGE) || isSending}
                  >
                    {isSending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Sending...</span>
                      </div>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Number Modal */}
        {isAddNumberModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-gray-900">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Add Phone Number</h4>
                <button
                  onClick={() => {
                    setIsAddNumberModalOpen(false);
                    setInputNumber("");
                    setValidationError("");
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    id="phoneNumber"
                    type="text"
                    value={inputNumber}
                    onChange={(e) => {
                      setInputNumber(e.target.value);
                      setValidationError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && addRecipient()}
                    placeholder="+2567XXXXXXXX"
                    className="w-full rounded-lg border border-gray-200 p-3 pl-12 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400">
                      <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </span>
                  </div>
                </div>
                {validationError && (
                  <p className="mt-1 text-sm text-red-500">{validationError}</p>
                )}
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
                <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Accepted Formats:
                </h5>
                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <li>• +2567XXXXXXXX (Local format)</li>
                  <li>• 2567XXXXXXXX (Without + sign)</li>
                  <li>• 07XXXXXXXX (Uganda local format)</li>
                  {/* <li>• 7XXXXXXXX (Without leading zero)</li> */}
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setIsAddNumberModalOpen(false);
                    setInputNumber("");
                    setValidationError("");
                  }}
                  variant="primary"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={addRecipient}
                  variant="primary"
                  className="flex-1"
                  disabled={!inputNumber.trim()}
                >
                  Add Number
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Import Contacts Modal */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 dark:bg-gray-900">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Import Contacts</h4>
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  disabled={isImporting}
                >
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              {isImporting ? (
                <div className="p-6 flex flex-col items-center">
                  <div className="w-16 h-16 border-4 border-t-brand-500 border-r-brand-300 border-b-brand-200 border-l-brand-100 rounded-full animate-spin mb-4"></div>
                  <h5 className="text-base font-medium text-gray-800 dark:text-white/90 mb-1">
                    Processing Contacts...
                  </h5>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Validating and importing phone numbers
                  </p>
                  {importProgress.total > 0 && (
                    <div className="w-full max-w-sm">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-1">
                        <div 
                          className="bg-brand-500 h-2.5 rounded-full" 
                          style={{ width: `${Math.min(100, (importProgress.processed / importProgress.total) * 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{importProgress.processed} of {importProgress.total} processed</span>
                        <span>{importProgress.valid} valid numbers</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 mb-4">
                    <div 
                      {...getRootProps()} 
                      className={`flex flex-col items-center justify-center cursor-pointer py-6 px-4 rounded-lg ${
                        isDragActive 
                          ? "border-brand-500 bg-brand-50 dark:bg-gray-800" 
                          : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                      }`}
                    >
                      <input {...getInputProps()} />
                      <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <h5 className="text-base font-medium text-gray-800 dark:text-white/90 mb-1">
                        {isDragActive ? "Drop your file here" : "Drag & Drop your file here"}
                      </h5>
                      <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-2">
                        Upload a CSV or Excel file containing phone numbers
                      </p>
                      <button className="text-sm text-brand-500 hover:text-brand-600 font-medium">
                        Browse Files
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <h5 className="text-sm font-medium text-gray-800 dark:text-white/90 mb-2">
                      File Requirements:
                    </h5>
                    <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1.5">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Excel (.xlsx) or CSV (.csv) files are supported</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Include a column named "phoneNumber", "phone", "mobile", "contact", or similar</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Ugandan phone numbers will be automatically validated and formatted</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Duplicate numbers will be automatically filtered out</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="flex items-center justify-end">
                    <Button
                      onClick={() => setIsImportModalOpen(false)}
                      variant="primary"
                      className="px-4"
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Magic Modal */}
      {showMagicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h4 className=" place-content-center text-lg font-semibold text-gray-800 dark:text-white/90">Generate SMS With LucoAI</h4>
              <button
                onClick={() => setShowMagicModal(false)}
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
                  Describe your message
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="E.g., Write a professional SMS to remind customers about their upcoming appointment"
                  className="w-full rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setShowMagicModal(false)}
                  variant="outline"
                  className="px-4"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => generateAIMessage(aiPrompt)}
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
                    'Generate SMS'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

}
