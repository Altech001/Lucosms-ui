import { useState, useCallback, useMemo, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { whatsappService } from '../../services/whatsappService';
import {
  Send,
  LoaderCircle,
  AlertCircle,
  CheckCircle,
  Info,
  Settings,
  Search,
  MessageSquare,
  Users,
  X,
} from "lucide-react";
import PageMeta from "@/utils/common/PageMeta";
import PageBreadcrumb from "@/utils/common/PageBreadCrumb";
import SidePanel from "@/components/common/Sidepanel";

// Strict Ugandan phone number formatter and validator
const formatAndValidateUgandanNumber = (number: string): string | null => {
  const cleaned = number.replace(/[^\d+]/g, "").trim();
  if (cleaned.startsWith("+256") && cleaned.length === 13) return cleaned;
  if (cleaned.startsWith("256") && cleaned.length === 12) return `+${cleaned}`;
  if (cleaned.startsWith("0") && cleaned.length === 10)
    return `+256${cleaned.substring(1)}`;
  if (
    cleaned.length === 9 &&
    (cleaned.startsWith("7") || cleaned.startsWith("4"))
  )
    return `+256${cleaned}`;
  return null;
};

const Sendbulk = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const [allNumbers, setAllNumbers] = useState<string[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<{
    type: "info" | "success" | "error";
    message: string;
  } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    // Automatically clear success/error messages after 5 seconds
    if (status?.type === "success" || status?.type === "error") {
      const timer = setTimeout(() => {
        setStatus(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const fileContent = reader.result as string;
        const fromFile = fileContent
          .split(/[\n,;\s]+/)
          .map(formatAndValidateUgandanNumber)
          .filter((n): n is string => n !== null);

        const uniqueNumbers = [...new Set([...allNumbers, ...fromFile])];
        setAllNumbers(uniqueNumbers);
        setStatus({
          type: "success",
          message: `Imported ${fromFile.length} valid numbers.`,
        });
      };
      reader.readAsText(file);
    },
    [allNumbers]
  );

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    noClick: true,
    accept: { "text/plain": [".txt", ".csv"] },
  });

  const filteredNumbers = useMemo(
    () => allNumbers.filter((n) => n.includes(searchTerm)),
    [allNumbers, searchTerm]
  );

  const handleSelectAll = (checked: boolean) => {
    setSelectedNumbers(checked ? filteredNumbers : []);
  };

  const handleSelectNumber = (number: string, checked: boolean) => {
    setSelectedNumbers((prev) =>
      checked ? [...prev, number] : prev.filter((n) => n !== number)
    );
  };

  const handleSend = async () => {
    if (selectedNumbers.length === 0 || !message) {
      setStatus({
        type: "error",
        message: "Please select recipients and write a message.",
      });
      return;
    }

    try {
      // Format phone numbers according to WhatsApp requirements
      const formattedNumbers = selectedNumbers.map((number) => {
        // Clean the number
        const cleanedNumber = number.trim().replace(/[^+\d]/g, "");

        // Add country code if not present (Uganda +256)
        const hasCountryCode = cleanedNumber.startsWith("+");
        return hasCountryCode ? cleanedNumber : `+256${cleanedNumber}`;
      });

      // Format for WhatsApp API
      const whatsappNumbers = formattedNumbers.map((number) => `${number}@c.us`);

      setIsSending(true);
      setStatus({
        type: "info",
        message: `Sending to ${selectedNumbers.length} recipients...`,
      });

      // Send messages using WhatsApp service
      const results = await Promise.all(
        whatsappNumbers.map(async (whatsappNumber) => {
          try {
            // Format the phone number for WhatsApp
            const formattedNumber = whatsappNumber.replace(/^\+/, '').replace(/[^0-9]/g, '');
            const whatsappNumberWithCountry = `+256${formattedNumber}`;
            
            // Set the recipient and message in the WhatsApp service
            whatsappService.setRecipient(whatsappNumberWithCountry);
            whatsappService.setMessage(message);
            
            const result = await whatsappService.sendMessage();
            
            // Ensure we got a proper response
            if (!result?.success) {
              throw new Error(result?.error || 'Message sending failed');
            }
            
            return {
              success: true,
              number: whatsappNumber,
              error: null
            };
          } catch (error) {
            console.error('Failed to send message:', error);
            return {
              success: false,
              number: whatsappNumber,
              error: error instanceof Error ? error.message : 'Failed to send message'
            };
          }
        })
      );

      // Process results
      const failed = results.filter((r: { success: boolean }) => !r.success);
      if (failed.length === 0) {
        setStatus({
          type: "success",
          message: `Successfully sent to ${selectedNumbers.length} recipients.`,
        });
        setSelectedNumbers([]);
        setMessage("");
      } else {
        const failedNumbers = failed.map(f => f.number).join(', ');
        setStatus({
          type: "error",
          message: `Failed to send to ${failed.length} recipients: ${failedNumbers}`,
        });
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: "An error occurred while sending messages.",
      });
      console.error("Sending failed:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <PageMeta title="Lucosms    - Send Bulk" description={"Send Bulk"} />
      <PageBreadcrumb pageTitle="Send Bulk" />

      <div className="w-full bg-transparent sm:p-4 lg:p-5 flex flex-col min-h-screen">
        <div className="relative">
          <SidePanel
            isOpen={isPanelOpen}
            onClose={() => setIsPanelOpen(false)}
          />
        </div>
        <div className=" w-full flex-grow grid grid-cols-12 gap-2 h-full">
          {/* Left Panel: Contacts */}
          <div className="col-span-11 lg:col-span-4 h-full flex flex-col bg-white rounded-lg border border-gray-200 p-4 overflow-hidden  shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between  mb-4">
              <h3 className="font-base text-lg">
                Contacts ({allNumbers.length})
              </h3>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded p-4 hover:bg-blue-700 transition-colors"
              >
                Add Number
              </button>
            </div>
            <div className="relative mb-4">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                size={18}
              />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex items-center gap-3 mb-3 px-1">
              <input
                type="checkbox"
                id="select-all"
                onChange={(e) => handleSelectAll(e.target.checked)}
                checked={
                  selectedNumbers.length === filteredNumbers.length &&
                  filteredNumbers.length > 0
                }
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 bg-gray-100 dark:bg-gray-700 focus:ring-blue-500"
              />
              <label
                htmlFor="select-all"
                className="text-sm text-gray-600 dark:text-gray-300"
              >
                Select All
              </label>
            </div>
            <div className="flex-grow overflow-y-auto pr-2 -mr-4 space-y-2">
              {filteredNumbers.length > 0 ? (
                filteredNumbers.map((num) => (
                  <div
                    key={num}
                    className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
                  >
                    <input
                      type="checkbox"
                      id={`cb-${num}`}
                      checked={selectedNumbers.includes(num)}
                      onChange={(e) =>
                        handleSelectNumber(num, e.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 bg-gray-100 dark:bg-gray-700 focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`cb-${num}`}
                      className="text-sm font-mono text-gray-700 dark:text-gray-300"
                    >
                      {num}
                    </label>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <Users size={40} className="mx-auto mb-2" />
                  <p className="text-sm">No contacts found</p>
                  <p className="text-xs">Click below to import.</p>
                </div>
              )}
            </div>
            <div
              {...getRootProps()}
              className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4"
            >
              <input {...getInputProps()} />
              <button
                type="button"
                onClick={open}
                className="w-full text-center text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
              >
                Import Contacts
              </button>
            </div>
          </div>

          {/* Middle Panel: Message Composer */}
          <div
            className={`col-span-12 ${
              isSettingsOpen ? "lg:col-span-8" : "lg:col-span-8"
            } h-full flex flex-col bg-white rounded-lg border border-gray-200 p-4 overflow-hidden shadow-sm dark:border-gray-800 dark:bg-white/[0.03] transition-all duration-300 ease-in-out`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">New Message</h3>
              <button
                // onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                onClick={() => setIsPanelOpen(true)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Toggle Bot Settings"
              >
                <Settings className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            {selectedNumbers.length > 0 ? (
              <div className="flex-grow flex flex-col">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full flex-grow p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                  placeholder="Type your message here..."
                />
                <button
                  onClick={handleSend}
                  disabled={isSending || !message}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-500/50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSending ? (
                    <LoaderCircle size={20} className="animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                  <span>
                    {isSending
                      ? "Sending..."
                      : `Send to ${selectedNumbers.length} recipients`}
                  </span>
                </button>
                <div className="mt-4 h-16">
                  {status && (
                    <Alert type={status.type} message={status.message} />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                <MessageSquare size={52} className="mb-4" />
                <h4 className="font-bold text-lg text-gray-600 dark:text-gray-400">
                  No recipients selected
                </h4>
                <p className="text-sm">
                  Select contacts from the left panel to begin.
                </p>
              </div>
            )}
          </div>

          {/* Right Panel: Bot Settings */}
          {isSettingsOpen && (
            <div className="col-span-12 lg:col-span-12 h-full flex flex-col bg-white rounded-lg border border-gray-200 p-4 overflow-hidden shadow-sm dark:border-gray-800 dark:bg-white/[0.03] animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Settings className="text-gray-500 dark:text-gray-400" />
                  <h3 className="font-semibold text-lg">Bot Settings</h3>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="text-gray-500 dark:text-gray-400" size={20} />
                </button>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="delivery-reports"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Delivery Reports
                  </label>
                  <input
                    type="checkbox"
                    id="delivery-reports"
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 bg-gray-100 dark:bg-gray-700 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="sending-speed"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Sending Speed
                  </label>
                  <select
                    id="sending-speed"
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <option>Normal</option>
                    <option>Fast</option>
                    <option>Slow</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="delay"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Delay Between Messages (s)
                  </label>
                  <input
                    type="number"
                    id="delay"
                    defaultValue={2}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        {isModalOpen && (
          <AddNumberModal
            onClose={() => setIsModalOpen(false)}
            onAdd={(num) => setAllNumbers([...new Set([...allNumbers, num])])}
          />
        )}
      </div>
    </>
  );
};

const AddNumberModal = ({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (number: string) => void;
}) => {
  const [number, setNumber] = useState("");
  const [error, setError] = useState("");

  const handleAdd = () => {
    const formatted = formatAndValidateUgandanNumber(number);
    if (formatted) {
      onAdd(formatted);
      onClose();
    } else {
      setError("Invalid Ugandan phone number format.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-xl bg-white dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700 shadow-xl">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Add Number Manually
        </h4>
        <input
          type="text"
          value={number}
          onChange={(e) => {
            setNumber(e.target.value);
            setError("");
          }}
          placeholder="+256... or 07..."
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-3 text-sm bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        />
        {error && (
          <p className="text-red-500 dark:text-red-400 text-xs mt-2">{error}</p>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Add Contact
          </button>
        </div>
      </div>
    </div>
  );
};

const alertStyles = {
  base: "flex items-center gap-3 p-3 rounded-lg border text-sm",
  success:
    "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-700/50 dark:text-green-300",
  error:
    "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-700/50 dark:text-red-300",
  info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700/50 dark:text-blue-300",
};

const alertIcons = {
  success: <CheckCircle size={18} />,
  error: <AlertCircle size={18} />,
  info: <Info size={18} />,
};

const Alert = ({
  type,
  message,
}: {
  type: "info" | "success" | "error";
  message: string;
}) => (
  <div className={`${alertStyles.base} ${alertStyles[type]}`}>
    {alertIcons[type]}
    <span className="font-medium">{message}</span>
  </div>
);

export default Sendbulk;
