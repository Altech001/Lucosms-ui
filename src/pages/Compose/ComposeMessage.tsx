/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { useAuth } from "@clerk/clerk-react";

// Components (assuming these exist)
import PageMeta from "../../utils/common/PageMeta";
import PageBreadcrumb from "../../utils/common/PageBreadCrumb";
import Alert from "../../utils/ui/alert/Alert";
import Button from "../../utils/ui/button/Button";
import { MoreDotIcon } from "../../icons";
import { Dropdown } from "../../utils/ui/dropdown/Dropdown";
import { DropdownItem } from "../../utils/ui/dropdown/DropdownItem";

// Types
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
// const GEMINI_API_KEY = "AIzaSyA08IKrb6jtuvNVEcCcE4c8w96VjbuE0tY";
// const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface AlertState {
  variant: "success" | "error";
  title: string;
  message: string;
}

// Constants
const MESSAGE_LIMIT = 160;
const COST_PER_MESSAGE = 32; // UGX per message
const PHONE_COLUMNS = [
  "phoneNumber",
  "phone",
  "mobile",
  "contact",
  "number",
  "Phone Number",
  "Mobile Number",
  "Contact Number",
  "Phone",
  "Mobile",
  "Contact",
  "Number",
  "Tel",
  "Telephone",
  "Cell",
];

// Utility functions
const formatUgandanPhoneNumber = (
  number: string
): { isValid: boolean; formattedNumber: string | null; error?: string } => {
  const cleaned = number.replace(/[^\d+]/g, "");
  if (!cleaned)
    return {
      isValid: false,
      formattedNumber: null,
      error: "Phone number cannot be empty",
    };

  if (
    cleaned.startsWith("+256") &&
    cleaned.length === 13 &&
    /^(\+2567|\+2564)/.test(cleaned)
  ) {
    return { isValid: true, formattedNumber: cleaned };
  }
  if (
    cleaned.startsWith("256") &&
    cleaned.length === 12 &&
    /^(2567|2564)/.test(cleaned)
  ) {
    return { isValid: true, formattedNumber: "+" + cleaned };
  }
  if (
    cleaned.startsWith("0") &&
    cleaned.length === 10 &&
    /^0[47]/.test(cleaned)
  ) {
    return { isValid: true, formattedNumber: "+256" + cleaned.substring(1) };
  }
  if (cleaned.length === 9 && /^[47]/.test(cleaned)) {
    return { isValid: true, formattedNumber: "+256" + cleaned };
  }
  return {
    isValid: false,
    formattedNumber: null,
    error: "Invalid phone number format",
  };
};

const validateNumbers = (numbers: string[]): string[] => {
  const validNumbers = new Set<string>();

  numbers.forEach((number) => {
    if (!number || typeof number !== "string") return;

    const { isValid, formattedNumber } = formatUgandanPhoneNumber(
      number.trim()
    );
    if (isValid && formattedNumber) {
      validNumbers.add(formattedNumber);
    }
  });

  return Array.from(validNumbers);
};

const exportToExcel = (messages: Message[]) => {
  const data = messages.map((msg) => ({
    "Message Content": msg.content,
    Timestamp: msg.timestamp,
    "Recipients Count": msg.recipientCount,
    Recipients: msg.recipients.map((r) => r.phoneNumber).join(", "),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Messages");
  XLSX.writeFile(
    wb,
    `lucosms_messages_${new Date().toISOString().split("T")[0]}.xlsx`
  );
};

export default function ComposeMessages() {
  const location = useLocation();
  const { getToken } = useAuth();
  const selectedTemplate = (location.state as { selectedTemplate?: Template })
    ?.selectedTemplate;

  // State management
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const cached = localStorage.getItem("recentMessages");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [newMessage, setNewMessage] = useState<string>(() => {
    if (selectedTemplate?.content) {
      if (selectedTemplate.content.includes("[name]")) {
        const name = prompt("Enter the name:") || "User";
        return selectedTemplate.content.replace("[name]", name);
      }
      return selectedTemplate.content;
    }
    return "";
  });

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [inputNumber, setInputNumber] = useState("");
  const [validationError, setValidationError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [balance, setBalance] = useState<number>(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [contactsPerPage] = useState(20);

  // UI state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddNumberModalOpen, setIsAddNumberModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    total: 0,
    processed: 0,
    valid: 0,
  });

  interface ImportProgress {
  total: number;
  processed: number;
  valid: number;
}

  // Filter contacts based on search query
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phoneNumber.includes(searchQuery)
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredContacts.length / contactsPerPage);
  const startIndex = (currentPage - 1) * contactsPerPage;
  const endIndex = startIndex + contactsPerPage;
  const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Auto-dismiss alert
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Fetch balance
  const fetchBalance = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/user/api/v1/wallet-balance`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setBalance(data.balance || 0);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  }, [getToken]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // SMS sending function
  const sendSMS = async (recipients: string[], message: string) => {
    const token = await getToken();
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/v1/send_sms`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipient: recipients, message }),
      }
    );

    const responseData = await response.json();
    if (!response.ok || responseData.status !== "success") {
      throw new Error(responseData.message || "Failed to send SMS");
    }
    return responseData;
  };

  // Process file import
  const processFileImport = async (
    file: File
  ): Promise<{ success: boolean; validNumbers: string[]; error?: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            resolve({
              success: false,
              validNumbers: [],
              error: "Failed to read file",
            });
            return;
          }

          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const parsedData = XLSX.utils.sheet_to_json(sheet) as any[];

          const numbers = parsedData
            .map((row) => {
              // Try phone columns first
              for (const col of PHONE_COLUMNS) {
                if (row[col]) return String(row[col]).trim();
              }

              // Try any column with phone-like data
              const values = Object.values(row);
              for (const value of values) {
                if (
                  value &&
                  typeof value === "string" &&
                  /[\d+\-\s()]{7,}/.test(value)
                ) {
                  return String(value).trim();
                }
              }
              return null;
            })
            .filter(
              (num): num is string =>
                num !== null && num !== "" && /\d/.test(num)
            );

          if (numbers.length === 0) {
            resolve({
              success: false,
              validNumbers: [],
              error: "No phone numbers found in the file",
            });
            return;
          }

          setImportProgress({ total: numbers.length, processed: 0, valid: 0 });

          const validNumbers = validateNumbers(numbers);
          setImportProgress({
            total: numbers.length,
            processed: numbers.length,
            valid: validNumbers.length,
          });

          resolve({
            success: true,
            validNumbers,
            error:
              validNumbers.length === 0
                ? "No valid Ugandan phone numbers found"
                : undefined,
          });
        } catch (error) {
          resolve({
            success: false,
            validNumbers: [],
            error: `Failed to process file: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          validNumbers: [],
          error: "Failed to read file",
        });
      };

      reader.readAsBinaryString(file);
    });
  };

  // Event handlers
  const addRecipient = () => {
    const trimmedValue = inputNumber.trim();
    if (!trimmedValue) return;

    setValidationError("");
    const { isValid, formattedNumber, error } =
      formatUgandanPhoneNumber(trimmedValue);
    if (
      isValid &&
      formattedNumber &&
      !selectedContacts.some((c) => c.phoneNumber === formattedNumber)
    ) {
      setSelectedContacts((prev) => [
        ...prev,
        {
          name: "Unknown",
          role: "N/A",
          phoneNumber: formattedNumber,
          lastActive: "Just now",
        },
      ]);
      setInputNumber("");
      setIsAddNumberModalOpen(false);
    } else {
      setValidationError(error || "Number already added");
    }
  };

  const handleSelectContact = (contact: Contact) => {
    setSelectedContacts((prev) => {
      const isSelected = prev.some(
        (c) => c.phoneNumber === contact.phoneNumber
      );
      return isSelected
        ? prev.filter((c) => c.phoneNumber !== contact.phoneNumber)
        : [...prev, contact];
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedContacts([]);
    } else {
      // Select all contacts from current page or all filtered contacts
      setSelectedContacts([...filteredContacts]);
    }
    setSelectAll(!selectAll);
  };

  const handleSendMessage = async () => {
    const totalCost = selectedContacts.length * COST_PER_MESSAGE;

    if (balance < totalCost) {
      setAlert({
        variant: "error",
        title: "Insufficient Balance",
        message: `You need ${totalCost} UGX. Current balance: ${balance} UGX`,
      });
      return;
    }

    if (newMessage.length > MESSAGE_LIMIT) {
      setAlert({
        variant: "error",
        title: "Message Too Long",
        message: `Message exceeds ${MESSAGE_LIMIT} character limit`,
      });
      return;
    }

    if (!newMessage.trim() || selectedContacts.length === 0) {
      setAlert({
        variant: "error",
        title: "Error",
        message: "Select contacts and enter a message",
      });
      return;
    }

    setIsSending(true);
    try {
      const responseData = await sendSMS(
        selectedContacts.map((contact) => contact.phoneNumber),
        newMessage
      );

      const timestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const updatedMessages = [
        {
          content: newMessage,
          timestamp,
          recipientCount: selectedContacts.length,
          recipients: [...selectedContacts],
        },
        ...messages,
      ].slice(0, 100); // Keep only last 100 messages

      setMessages(updatedMessages);
      localStorage.setItem("recentMessages", JSON.stringify(updatedMessages));

      setNewMessage("");
      setSelectedContacts([]);
      setSelectAll(false);

      setAlert({
        variant: "success",
        title: "Message Sent",
        message: `Sent to ${responseData.recipients_count} contacts. Cost: ${responseData.total_cost} UGX`,
      });

      // Refresh balance after sending
      setTimeout(() => {
        fetchBalance();
      }, 1000);
    } catch (error) {
      setAlert({
        variant: "error",
        title: "Send Failed",
        message:
          error instanceof Error ? error.message : "Failed to send message",
      });
    } finally {
      setIsSending(false);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const result = await processFileImport(file);

      if (!result.success) {
        setAlert({
          variant: "error",
          title: "Import Failed",
          message: result.error || "Failed to process file",
        });
        return;
      }

      const newContacts: Contact[] = result.validNumbers.map((num, index) => ({
        name: `Contact ${index + 1}`,
        role: "Imported",
        phoneNumber: num,
        lastActive: "Just now",
      }));

      const uniqueNewContacts = newContacts.filter(
        (c) => !contacts.some((p) => p.phoneNumber === c.phoneNumber)
      );

      setContacts((prev) => [...prev, ...uniqueNewContacts]);

      setAlert({
        variant: "success",
        title: "Import Successful",
        message: `Added ${uniqueNewContacts.length} new contacts. ${
          result.validNumbers.length - uniqueNewContacts.length
        } duplicates skipped.`,
      });

      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportProgress({ total: 0, processed: 0, valid: 0 });
      }, 2000);
    } catch (error) {
      setAlert({
        variant: "error",
        title: "Import Failed",
        message: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "text/csv": [".csv"],
    },
    disabled: isImporting,
    maxFiles: 1,
  });

  const handleClearAllMessages = () => {
    if (window.confirm("Delete all message history?")) {
      setMessages([]);
      localStorage.removeItem("recentMessages");
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const remainingChars = MESSAGE_LIMIT - newMessage.length;
  const totalCost = selectedContacts.length * COST_PER_MESSAGE;
  const canSend =
    newMessage.trim() &&
    selectedContacts.length > 0 &&
    remainingChars >= 0 &&
    balance >= totalCost &&
    !isSending;

  return (
    <>
      <PageMeta
        title="Compose Messages - LucoSMS"
        description="Send SMS messages to multiple contacts"
      />
      <PageBreadcrumb pageTitle="Compose Messages" />

      {alert && (
        <div className="fixed top-20 right-4 z-50 w-80 shadow-lg">
          <Alert
            variant={alert.variant}
            title={alert.title}
            message={alert.message}
            showLink={false}
          />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)]">
        {/* Contacts Sidebar */}
        <div className="w-full lg:w-1/3 bg-white rounded-xl border border-gray-200  dark:border-gray-800 dark:bg-white/[0.03] shadow-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Contacts ({contacts.length})
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddNumberModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Add Number
                </Button>
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <MoreDotIcon className="w-5 h-5 text-gray-500" />
                  </button>
                  <Dropdown
                    isOpen={isDropdownOpen}
                    onClose={() => setIsDropdownOpen(false)}
                  >
                    <DropdownItem
                      onItemClick={() => setIsImportModalOpen(true)}
                    >
                      Import Contacts
                    </DropdownItem>
                  </Dropdown>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <div className="absolute left-3 top-2.5">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Select All */}
          {filteredContacts.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select All ({filteredContacts.length})
                  </span>
                </label>
                {selectedContacts.length > 0 && (
                  <span className="text-xs text-blue-600 font-medium">
                    {selectedContacts.length} selected
                  </span>
                )}
              </div>
              {totalPages > 1 && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Showing {startIndex + 1}-
                  {Math.min(endIndex, filteredContacts.length)} of{" "}
                  {filteredContacts.length} contacts
                </div>
              )}
            </div>
          )}

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto max-h-[calc(100vh-300px)] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8">
                <svg
                  className="w-12 h-12 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <p className="text-sm font-medium mb-2">
                  {searchQuery ? "No matching contacts" : "No contacts yet"}
                </p>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Import contacts to get started
                </button>
              </div>
            ) : (
              <>
                <div className="p-3 space-y-2">
                  {paginatedContacts.slice(0, 10).map((contact, index) => (
                    <div
                      key={startIndex + index}
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedContacts.some(
                          (c) => c.phoneNumber === contact.phoneNumber
                        )
                          ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => handleSelectContact(contact)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedContacts.some(
                          (c) => c.phoneNumber === contact.phoneNumber
                        )}
                        onChange={() => handleSelectContact(contact)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {contact.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {contact.phoneNumber}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                        Previous
                      </button>

                      <div className="flex items-center space-x-2">
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                  currentPage === pageNum
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                        )}

                        {totalPages > 5 && currentPage < totalPages - 2 && (
                          <>
                            <span className="text-gray-500">...</span>
                            <button
                              onClick={() => setCurrentPage(totalPages)}
                              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                        <svg
                          className="w-4 h-4 ml-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Selected Contacts Summary */}
          {selectedContacts.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {selectedContacts.length} contacts selected
                </span>
                <button
                  onClick={() => {
                    setSelectedContacts([]);
                    setSelectAll(false);
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Message Compose Area */}
        <div className="flex-1 bg-white  rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedContacts.length > 0
                  ? `Composing to ${selectedContacts.length} contact${
                      selectedContacts.length === 1 ? "" : "s"
                    }`
                  : "New Message"}
              </h4>
              {messages.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => exportToExcel(messages)}
                    variant="outline"
                    size="sm"
                  >
                    Export
                  </Button>
                  <Button
                    onClick={handleClearAllMessages}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Messages History */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <svg
                  className="w-16 h-16 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-lg font-medium mb-2">No messages yet</p>
                <p className="text-sm text-center max-w-md">
                  Your sent messages will appear here. Select contacts and
                  compose your first message.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-bold">
                          SMS
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            To {message.recipientCount} recipient
                            {message.recipientCount === 1 ? "" : "s"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {message.timestamp}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Compose Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {selectedContacts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  Select contacts to start composing
                </p>
                <Button
                  onClick={() => setIsAddNumberModalOpen(true)}
                  variant="primary"
                >
                  Add Phone Number
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className={`w-full p-3 pr-12 rounded-lg border ${
                      remainingChars < 0 ? "border-red-300" : "border-gray-300"
                    } dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    rows={4}
                  />
                  <div className="absolute right-3 bottom-3">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600"
                      type="button"
                    >
                      😊
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-10 right-0 z-50">
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

                {/* Message Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                    <span
                      className={
                        remainingChars < 0 ? "text-red-500 font-medium" : ""
                      }
                    >
                      {remainingChars} characters remaining
                    </span>
                    <span>Cost: {totalCost} UGX</span>
                    <span>Balance: {balance} UGX</span>
                  </div>

                  <Button
                    onClick={handleSendMessage}
                    disabled={!canSend}
                    variant="primary"
                    className="min-w-[120px]"
                  >
                    {isSending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </div>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
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
      </div>

      {/* Add Number Modal */}
      {isAddNumberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add Phone Number
              </h4>
              <button
                onClick={() => {
                  setIsAddNumberModalOpen(false);
                  setInputNumber("");
                  setValidationError("");
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={inputNumber}
                  onChange={(e) => {
                    setInputNumber(e.target.value);
                    setValidationError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && addRecipient()}
                  placeholder="+256700000000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {validationError && (
                  <p className="mt-1 text-sm text-red-600">{validationError}</p>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Supported Formats:
                </h5>
                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <li>• +256700000000 (International)</li>
                  <li>• 0700000000 (Local with 0)</li>
                  <li>• 700000000 (Local without 0)</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setIsAddNumberModalOpen(false);
                    setInputNumber("");
                    setValidationError("");
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={addRecipient}
                  disabled={!inputNumber.trim()}
                  variant="primary"
                  className="flex-1"
                >
                  Add Number
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Contacts Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Import Contacts
              </h4>
              <button
                onClick={() => setIsImportModalOpen(false)}
                disabled={isImporting}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 disabled:opacity-50"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {isImporting ? (
              <div className="flex flex-col items-center py-8">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <h5 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Processing File...
                </h5>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                  Validating phone numbers
                </p>
                {importProgress.total > 0 && (
                  <div className="w-full max-w-sm">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            (importProgress.processed / importProgress.total) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Processed: {importProgress.processed}</span>
                      <span>Valid: {importProgress.valid}</span>
                      <span>Total: {importProgress.total}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <input {...getInputProps()} />
                  <svg
                    className="w-12 h-12 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <h5 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {isDragActive
                      ? "Drop your file here"
                      : "Upload Contact File"}
                  </h5>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Drag and drop or click to browse
                  </p>
                  <p className="text-xs text-gray-400">
                    Supports CSV and Excel (.xlsx) files
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    File Requirements:
                  </h5>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Include phone numbers in any column</li>
                    <li>• Ugandan numbers will be auto-validated</li>
                    <li>• Duplicates are automatically filtered</li>
                    <li>• Supports various phone number formats</li>
                  </ul>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setIsImportModalOpen(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
