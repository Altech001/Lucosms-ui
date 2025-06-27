import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Smartphone,
  Copy,
  LoaderCircle,
  Eye,
  Bot,
  ThumbsUp,
  UploadCloud,
  Code,
  User,
  MessageCircle,
  QrCode,
} from "lucide-react";

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ToggleSwitchProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: React.ElementType;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  id,
  label,
  checked,
  onChange,
  icon: Icon,
}) => (
  <div className="flex items-center justify-between py-2">
    <label
      htmlFor={id}
      className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
    >
      <Icon size={16} className="mr-3 text-gray-500" />
      {label}
    </label>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`${
        checked ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-600"
      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
    >
      <span
        aria-hidden="true"
        className={`${
          checked ? "translate-x-5" : "translate-x-0"
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  </div>
);

const SidePanel: React.FC<SidePanelProps> = ({ isOpen, onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [pairingResult, setPairingResult] = useState<{
    code?: string;
    error?: string;
  } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [autoViewStatus, setAutoViewStatus] = useState(false);
  const [chatbotEnabled, setChatbotEnabled] = useState(true);
  const [autoReact, setAutoReact] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    url?: string;
    error?: string;
  } | null>(null);

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);



  const handleGenerateCode = async () => {
    if (!phoneNumber || phoneNumber.replace(/[^0-9]/g, "").length < 11) {
      setPairingResult({
        error: "Invalid phone number. Please include country code.",
      });
      return;
    }
    setIsGenerating(true);
    setPairingResult(null);
    try {
      const response = await fetch(
        `http://localhost:8000/code?number=${phoneNumber.replace(
          /[^0-9]/g,
          ""
        )}`
      );
      const data = await response.json();
      if (response.ok && data.code) {
        setPairingResult({ code: data.code });
      } else {
        setPairingResult({ error: data.code || "Service Unavailable" });
      }
    } catch (error) {
      console.error("Pairing code generation error:", error);
      setPairingResult({ error: "Failed to connect to the service." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateQR = async () => {
    setIsGeneratingQR(true);
    setQrCode(null);
    setQrError(null);
    try {
      const response = await fetch('http://localhost:8000/qr');
      if (response.ok) {
        const data = await response.json();
        if (data.qr) {
          const imageUrl = await QRCode.toDataURL(data.qr);
          setQrCode(imageUrl);
        } else {
          setQrError('QR code data not found in response.');
        }
      } else {
        try {
            const errorData = await response.json();
            setQrError(errorData.code || 'Failed to generate QR code.');
        } catch {
            setQrError('Failed to generate QR code.');
        }
      }
    } catch (error) {
      console.error('QR code generation error:', error);
      setQrError('Failed to connect to the service.');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setUploadResult(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadResult({ error: "Please select a file first." });
      return;
    }
    setIsUploading(true);
    setUploadResult(null);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (response.ok && data.url) {
        setUploadResult({ url: data.url });
      } else {
        setUploadResult({ error: data.error || "Upload failed." });
      }
    } catch (error) {
      console.error("File upload error:", error);
      setUploadResult({ error: "Failed to connect to the upload service." });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 h-full w-96 bg-white dark:bg-gray-800 shadow-lg z-50 border-l border-gray-200 dark:border-gray-700 flex flex-col"
        >
          <div className="p-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Advanced Features
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="overflow-y-auto max-h-full p-4 flex-grow">
            <form
              id="side-panel-form"
              className="space-y-6 divide-y divide-gray-200 dark:divide-gray-700"
            >
              {/* Credentials Section */}
              <div className="space-y-4 pt-2 pb-2">
                <div className="space-y-2">
                  <h2 className="text-base pb-2 font-semibold text-gray-800 dark:text-white">
                    Bot Credentials
                  </h2>
                  <label
                    htmlFor="code-pairing"
                    className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    <Code size={16} className="mr-2" />
                    Code Pairing
                  </label>
                  <input
                    type="text"
                    id="code-pairing"
                    placeholder="Enter pairing code"
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    <User size={16} className="mr-2" />
                    Bot Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    placeholder="Enter your name"
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="senderId"
                    className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    <MessageCircle size={16} className="mr-2" />
                    Sender ID
                  </label>
                  <input
                    type="text"
                    id="senderId"
                    placeholder="Enter sender ID"
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Automation Settings */}
              <div className="space-y-2 pt-2 pb-2">
                <ToggleSwitch
                  id="auto-view-status"
                  label="Auto View Status"
                  checked={autoViewStatus}
                  onChange={setAutoViewStatus}
                  icon={Eye}
                />
                <ToggleSwitch
                  id="chatbot"
                  label="Chatbot"
                  checked={chatbotEnabled}
                  onChange={setChatbotEnabled}
                  icon={Bot}
                />
                <ToggleSwitch
                  id="auto-react"
                  label="Auto React to Messages"
                  checked={autoReact}
                  onChange={setAutoReact}
                  icon={ThumbsUp}
                />
              </div>

              {/* File Uploader */}
              <div className="pt-4 pb-4 space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <UploadCloud size={16} className="mr-2" />
                  Upload File to URL
                </label>
                <div className="flex items-center gap-2">
                  <label className="relative w-full flex flex-col items-center justify-center p-4 text-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                    <UploadCloud className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedFile
                        ? selectedFile.name
                        : "Click to browse or drag & drop"}
                    </span>
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                {selectedFile && (
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={handleFileUpload}
                      disabled={isUploading}
                      className="px-4 py-2 rounded-md text-sm bg-green-600 text-white hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center"
                    >
                      {isUploading ? (
                        <LoaderCircle size={18} className="animate-spin" />
                      ) : (
                        "Upload"
                      )}
                    </button>
                  </div>
                )}
                {uploadResult && (
                  <div className="mt-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                    {uploadResult.url && (
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Your file URL is:
                        </p>
                        <div className="flex items-center justify-between mt-1 gap-2">
                          <span className="text-sm font-mono text-gray-900 dark:text-white break-all">
                            {uploadResult.url}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              navigator.clipboard.writeText(
                                uploadResult.url || ""
                              )
                            }
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex-shrink-0"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                    {uploadResult.error && (
                      <p className="text-sm text-red-500 dark:text-red-400">
                        {uploadResult.error}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* QR Code Generation */}
              <div className="pt-6 space-y-2">
                <label
                  htmlFor="qr-code"
                  className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  <QrCode size={16} className="mr-2" />
                  WhatsApp QR Code
                </label>
                <button
                  type="button"
                  onClick={handleGenerateQR}
                  disabled={isGeneratingQR}
                  className="w-full px-4 py-2 rounded-md text-sm bg-green-600 text-white hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center"
                >
                  {isGeneratingQR ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : (
                    "Generate QR Code"
                  )}
                </button>
                {qrCode && (
                  <div className="mt-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 flex justify-center">
                    <img src={qrCode} alt="WhatsApp QR Code" />
                  </div>
                )}
                {qrError && (
                  <p className="text-sm text-red-500 dark:text-red-400">
                    {qrError}
                  </p>
                )}
              </div>

              {/* Pairing Code Generation */}
              <div className="pt-6 space-y-2">
                <label
                  htmlFor="phone-number"
                  className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  <Smartphone size={16} className="mr-2" />
                  Generate Pairing Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    id="phone-number"
                    placeholder="255760****"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    disabled={isGenerating}
                    className="px-4 py-2 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center"
                  >
                    {isGenerating ? (
                      <LoaderCircle size={18} className="animate-spin" />
                    ) : (
                      "Generate"
                    )}
                  </button>
                </div>
                {pairingResult && (
                  <div className="mt-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                    {pairingResult.code && (
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Your pairing code is:
                        </p>
                        <div className="flex items-center justify-between mt-1 gap-2">
                          <span className="text-lg font-mono font-bold text-gray-900 dark:text-white break-all">
                            {pairingResult.code}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              navigator.clipboard.writeText(
                                pairingResult.code || ""
                              )
                            }
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex-shrink-0"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                    {pairingResult.error && (
                      <p className="text-sm text-red-500 dark:text-red-400">
                        {pairingResult.error}
                      </p>
                    )}
                  </div>
                )}
                {isGenerating && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center">
                    <LoaderCircle size={14} className="animate-spin mr-2" />
                    Please wait a while...
                  </p>
                )}
              </div>
            </form>
          </div>
          <div className="p-6 flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              form="side-panel-form"
              className="w-full px-4 py-3 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Save All Settings
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SidePanel;
